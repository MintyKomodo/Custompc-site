/**
 * Square Web Payments SDK Integration Module
 * Handles payment processing, tokenization, and customer card management
 */

class SquarePayments {
    constructor() {
        this.payments = null;
        this.card = null;
        
        // Initialize configuration
        this.config = new SquareConfig();
        this.applicationId = this.config.getApplicationId();
        this.locationId = this.config.getLocationId();
        this.environment = this.config.getEnvironment();
        this.apiBaseUrl = this.config.getApiBaseUrl();
        
        this.isInitialized = false;
        
        // Validate configuration
        if (!this.config.isValid()) {
            console.error('Square configuration is invalid. Please check your credentials.');
            this.showError('Payment system configuration error. Please contact support.');
        }
        
        // Check if user is under 18 - demo mode
        this.isDemoMode = this.checkDemoMode();
    }

    /**
     * Check if running in demo mode (for under 18 users)
     */
    checkDemoMode() {
        // Check for demo mode flag
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('demo') === 'true' || 
               localStorage.getItem('payment_demo_mode') === 'true' ||
               this.environment === 'sandbox';
    }

    /**
     * Initialize Square Web Payments SDK
     */
    async initializeSquareSDK() {
        try {
            // Check if Square SDK is loaded
            if (typeof Square === 'undefined') {
                throw new Error('Square Web Payments SDK not loaded');
            }

            // Initialize payments object
            this.payments = Square.payments(this.applicationId, this.locationId);
            
            // Initialize card payment method
            await this.initializeCard();
            
            this.isInitialized = true;
            console.log('Square Web Payments SDK initialized successfully');
            
            return true;
        } catch (error) {
            console.error('Failed to initialize Square SDK:', error);
            this.showError('Failed to initialize payment system. Please refresh the page and try again.');
            return false;
        }
    }

    /**
     * Initialize card payment method
     */
    async initializeCard() {
        try {
            this.card = await this.payments.card();
            await this.card.attach('#card-container');
            
            // Add event listeners for card validation
            this.card.addEventListener('cardBrandChanged', (event) => {
                console.log('Card brand changed:', event.detail);
            });

            this.card.addEventListener('errorClassAdded', (event) => {
                console.log('Card validation error:', event.detail);
            });

            this.card.addEventListener('errorClassRemoved', (event) => {
                console.log('Card validation error resolved:', event.detail);
            });

        } catch (error) {
            console.error('Failed to initialize card:', error);
            throw error;
        }
    }

    /**
     * Process payment with the provided amount and customer information
     */
    async processPayment(amount, customerInfo = {}) {
        if (!this.isInitialized) {
            throw new Error('Square SDK not initialized');
        }

        try {
            // Validate form data before processing
            const validationErrors = this.validatePaymentForm();
            if (validationErrors.length > 0) {
                throw new Error(validationErrors[0]);
            }

            // Show processing state
            this.showProcessing(true);

            // Add retry mechanism for tokenization
            const tokenResult = await this.tokenizeWithRetry();
            
            if (tokenResult.status === 'OK') {
                // Process the payment with the token
                const paymentResult = await this.submitPaymentWithRetry(tokenResult.token, amount, customerInfo);
                
                if (paymentResult.success) {
                    this.showSuccess('Payment processed successfully!');
                    return {
                        success: true,
                        transactionId: paymentResult.transactionId,
                        amount: amount,
                        last4: tokenResult.details?.card?.last4 || 'Unknown'
                    };
                } else {
                    throw new Error(paymentResult.error || 'Payment processing failed');
                }
            } else {
                // Handle tokenization errors with user-friendly messages
                const errorMessage = this.formatTokenizationError(tokenResult.errors);
                throw new Error(errorMessage);
            }

        } catch (error) {
            console.error('Payment processing error:', error);
            const userFriendlyError = this.formatUserError(error);
            this.showError(userFriendlyError);
            return {
                success: false,
                error: userFriendlyError
            };
        } finally {
            this.showProcessing(false);
        }
    }

    /**
     * Tokenize card with retry mechanism
     */
    async tokenizeWithRetry(maxRetries = 2) {
        let lastError = null;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Tokenization attempt ${attempt}/${maxRetries}`);
                const result = await this.card.tokenize();
                
                if (result.status === 'OK') {
                    return result;
                }
                
                lastError = result;
                
                // If not the last attempt, wait before retrying
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                }
                
            } catch (error) {
                lastError = { errors: [{ detail: error.message }] };
                
                // If not the last attempt, wait before retrying
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                }
            }
        }
        
        return lastError;
    }

    /**
     * Submit payment with retry mechanism
     */
    async submitPaymentWithRetry(token, amount, customerInfo, maxRetries = 2) {
        let lastError = null;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Payment submission attempt ${attempt}/${maxRetries}`);
                const result = await this.submitPayment(token, amount, customerInfo);
                
                if (result.success) {
                    return result;
                }
                
                lastError = result;
                
                // Don't retry certain types of errors (declined cards, etc.)
                if (this.isNonRetryableError(result.error)) {
                    break;
                }
                
                // If not the last attempt, wait before retrying
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
                }
                
            } catch (error) {
                lastError = { success: false, error: error.message };
                
                // Don't retry network timeout errors immediately
                if (attempt < maxRetries && !this.isNetworkError(error)) {
                    await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
                }
            }
        }
        
        return lastError;
    }

    /**
     * Check if error should not be retried
     */
    isNonRetryableError(errorMessage) {
        const nonRetryableErrors = [
            'declined',
            'insufficient funds',
            'invalid card',
            'expired card',
            'incorrect cvc',
            'card not supported'
        ];
        
        const lowerError = errorMessage.toLowerCase();
        return nonRetryableErrors.some(error => lowerError.includes(error));
    }

    /**
     * Check if error is network-related
     */
    isNetworkError(error) {
        const networkErrors = [
            'network error',
            'timeout',
            'connection failed',
            'fetch failed'
        ];
        
        const errorMessage = error.message.toLowerCase();
        return networkErrors.some(netError => errorMessage.includes(netError));
    }

    /**
     * Format tokenization errors for user display
     */
    formatTokenizationError(errors) {
        if (!errors || errors.length === 0) {
            return 'Card validation failed. Please check your card information.';
        }

        const errorMessages = errors.map(error => {
            const detail = error.detail || error.message || '';
            
            // Map technical errors to user-friendly messages
            if (detail.includes('INVALID_CARD_NUMBER')) {
                return 'Invalid card number. Please check and try again.';
            }
            if (detail.includes('INVALID_EXPIRATION_DATE')) {
                return 'Invalid expiration date. Please check the month and year.';
            }
            if (detail.includes('INVALID_CVV')) {
                return 'Invalid security code (CVV). Please check the 3-4 digit code on your card.';
            }
            if (detail.includes('CARD_EXPIRED')) {
                return 'This card has expired. Please use a different card.';
            }
            if (detail.includes('UNSUPPORTED_CARD_BRAND')) {
                return 'This card type is not supported. Please use Visa, Mastercard, American Express, or Discover.';
            }
            
            return detail || 'Card validation error';
        });

        return errorMessages[0]; // Return the first (most relevant) error
    }

    /**
     * Format errors for user-friendly display
     */
    formatUserError(error) {
        const message = error.message || 'An unexpected error occurred';
        
        // Network errors
        if (this.isNetworkError(error)) {
            return 'Network connection error. Please check your internet connection and try again.';
        }
        
        // Square API errors
        if (message.includes('PAYMENT_METHOD_NOT_SUPPORTED')) {
            return 'This payment method is not supported. Please try a different card.';
        }
        
        if (message.includes('AMOUNT_TOO_HIGH')) {
            return 'Payment amount is too high. Please contact support for large transactions.';
        }
        
        if (message.includes('AMOUNT_TOO_LOW')) {
            return 'Payment amount is too low. Minimum payment is $1.00.';
        }
        
        if (message.includes('GENERIC_DECLINE')) {
            return 'Payment was declined. Please try a different payment method or contact your bank.';
        }
        
        if (message.includes('INSUFFICIENT_FUNDS')) {
            return 'Insufficient funds. Please try a different payment method.';
        }
        
        if (message.includes('CVV_FAILURE')) {
            return 'Security code verification failed. Please check your CVV and try again.';
        }
        
        if (message.includes('ADDRESS_VERIFICATION_FAILURE')) {
            return 'Address verification failed. Please check your billing address.';
        }
        
        // Return original message if no specific mapping found
        return message;
    }

    /**
     * Submit payment to backend
     */
    async submitPayment(token, amount, customerInfo) {
        try {
            // Use the backend API URL
            const apiUrl = this.apiBaseUrl + '/payments/process';
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sourceId: token,
                    amount: amount,
                    customerInfo: customerInfo,
                    idempotencyKey: this.generateIdempotencyKey()
                })
            });

            const result = await response.json();
            
            if (response.ok && result.success) {
                return {
                    success: true,
                    transactionId: result.transactionId,
                    amount: result.amount,
                    receiptUrl: result.receiptUrl,
                    last4: result.last4
                };
            } else {
                return {
                    success: false,
                    error: result.error || 'Payment processing failed'
                };
            }
        } catch (error) {
            console.error('Payment submission error:', error);
            return {
                success: false,
                error: 'Network error occurred. Please try again.'
            };
        }
    }

    /**
     * Generate a unique idempotency key for payment requests
     */
    generateIdempotencyKey() {
        return 'payment_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
    }

    /**
     * Save customer card for future use
     */
    async saveCustomerCard(customerInfo) {
        if (!this.isInitialized) {
            throw new Error('Square SDK not initialized');
        }

        try {
            const tokenResult = await this.card.tokenize();
            
            if (tokenResult.status === 'OK') {
                // Create or get customer
                const customer = await this.createOrGetCustomer(customerInfo);
                
                // Save card to customer
                const cardResult = await this.saveCardToCustomer(customer.customerId, tokenResult.token, tokenResult.details);
                
                // Store customer and card info locally for UI
                this.storeCustomerCardLocally(customer, cardResult);
                
                return {
                    success: true,
                    customerId: customer.customerId,
                    cardId: cardResult.cardId,
                    last4: tokenResult.details?.card?.last4 || 'Unknown',
                    brand: tokenResult.details?.card?.brand || 'Unknown',
                    expirationMonth: tokenResult.details?.card?.expMonth,
                    expirationYear: tokenResult.details?.card?.expYear
                };
            } else {
                const errors = tokenResult.errors || [];
                const errorMessage = errors.map(error => error.detail).join(', ') || 'Card tokenization failed';
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error('Failed to save customer card:', error);
            throw error;
        }
    }

    /**
     * Get all customers with their saved cards
     */
    getAllCustomersWithCards() {
        return this.getStoredCustomers();
    }

    /**
     * Get customer by ID with all their cards
     */
    getCustomerById(customerId) {
        const customers = this.getStoredCustomers();
        return customers.find(c => c.customerId === customerId);
    }

    /**
     * Update customer information
     */
    updateCustomerInfo(customerId, updatedInfo) {
        try {
            const customers = this.getStoredCustomers();
            const customerIndex = customers.findIndex(c => c.customerId === customerId);
            
            if (customerIndex > -1) {
                customers[customerIndex] = {
                    ...customers[customerIndex],
                    ...updatedInfo,
                    updatedAt: new Date().toISOString()
                };
                
                localStorage.setItem('square_customers', JSON.stringify(customers));
                return { success: true, customer: customers[customerIndex] };
            }
            
            return { success: false, error: 'Customer not found' };
        } catch (error) {
            console.error('Failed to update customer:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get customer's primary (most recently used) card
     */
    getCustomerPrimaryCard(customerId) {
        const customer = this.getCustomerById(customerId);
        if (!customer || !customer.cards || customer.cards.length === 0) {
            return null;
        }
        
        // Return the most recently created card as primary
        return customer.cards.sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        )[0];
    }

    /**
     * Set a card as primary for a customer
     */
    setCustomerPrimaryCard(customerId, cardId) {
        try {
            const customers = this.getStoredCustomers();
            const customer = customers.find(c => c.customerId === customerId);
            
            if (customer && customer.cards) {
                // Update all cards to not be primary
                customer.cards.forEach(card => {
                    card.isPrimary = card.cardId === cardId;
                });
                
                localStorage.setItem('square_customers', JSON.stringify(customers));
                return { success: true };
            }
            
            return { success: false, error: 'Customer or card not found' };
        } catch (error) {
            console.error('Failed to set primary card:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Create or get existing customer
     */
    async createOrGetCustomer(customerInfo) {
        // In a real implementation, this would call your backend API
        // which would then call Square's Customers API
        
        // For demo purposes, simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if customer exists in local storage
        const existingCustomers = this.getStoredCustomers();
        const existingCustomer = existingCustomers.find(c => c.email === customerInfo.email);
        
        if (existingCustomer) {
            return existingCustomer;
        }
        
        // Create new customer
        const newCustomer = {
            customerId: 'cust_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11),
            name: customerInfo.name,
            email: customerInfo.email,
            phone: customerInfo.phone || null,
            createdAt: new Date().toISOString()
        };
        
        console.log('Created new customer:', newCustomer);
        return newCustomer;
    }

    /**
     * Save card to customer in Square's system
     */
    async saveCardToCustomer(customerId, cardToken, cardDetails) {
        // In a real implementation, this would call your backend API
        // which would then call Square's Cards API to save the card
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const cardResult = {
            cardId: 'card_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11),
            customerId: customerId,
            last4: cardDetails?.card?.last4 || 'Unknown',
            brand: cardDetails?.card?.brand || 'Unknown',
            expirationMonth: cardDetails?.card?.expMonth,
            expirationYear: cardDetails?.card?.expYear,
            createdAt: new Date().toISOString()
        };
        
        console.log('Saved card to Square:', cardResult);
        return cardResult;
    }

    /**
     * Store customer and card info locally for UI purposes
     */
    storeCustomerCardLocally(customer, cardInfo) {
        try {
            // Get existing customers
            const customers = this.getStoredCustomers();
            
            // Find or create customer entry
            let customerEntry = customers.find(c => c.customerId === customer.customerId);
            if (!customerEntry) {
                customerEntry = {
                    ...customer,
                    cards: []
                };
                customers.push(customerEntry);
            } else {
                // Update customer info if it exists
                customerEntry.name = customer.name || customerEntry.name;
                customerEntry.email = customer.email || customerEntry.email;
                customerEntry.phone = customer.phone || customerEntry.phone;
                customerEntry.updatedAt = new Date().toISOString();
            }
            
            // Add card if not already exists
            const existingCard = customerEntry.cards.find(c => c.cardId === cardInfo.cardId);
            if (!existingCard) {
                // Set as primary if it's the first card
                const isPrimary = customerEntry.cards.length === 0;
                customerEntry.cards.push({
                    ...cardInfo,
                    isPrimary: isPrimary,
                    lastUsed: new Date().toISOString()
                });
            } else {
                // Update existing card info
                Object.assign(existingCard, cardInfo, {
                    lastUsed: new Date().toISOString()
                });
            }
            
            // Store updated customers list
            localStorage.setItem('square_customers', JSON.stringify(customers));
            
        } catch (error) {
            console.error('Failed to store customer data locally:', error);
        }
    }

    /**
     * Update card last used timestamp
     */
    updateCardLastUsed(customerId, cardId) {
        try {
            const customers = this.getStoredCustomers();
            const customer = customers.find(c => c.customerId === customerId);
            
            if (customer && customer.cards) {
                const card = customer.cards.find(c => c.cardId === cardId);
                if (card) {
                    card.lastUsed = new Date().toISOString();
                    localStorage.setItem('square_customers', JSON.stringify(customers));
                }
            }
        } catch (error) {
            console.error('Failed to update card last used:', error);
        }
    }

    /**
     * Get customer's cards sorted by usage (most recent first)
     */
    getCustomerCardsSorted(customerId, sortBy = 'lastUsed') {
        const customer = this.getCustomerById(customerId);
        if (!customer || !customer.cards) {
            return [];
        }
        
        return customer.cards.sort((a, b) => {
            switch (sortBy) {
                case 'lastUsed':
                    return new Date(b.lastUsed || b.createdAt) - new Date(a.lastUsed || a.createdAt);
                case 'created':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case 'brand':
                    return (a.brand || '').localeCompare(b.brand || '');
                default:
                    return 0;
            }
        });
    }

    /**
     * Get stored customers from local storage
     */
    getStoredCustomers() {
        try {
            const stored = localStorage.getItem('square_customers');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Failed to retrieve stored customers:', error);
            return [];
        }
    }

    /**
     * Retrieve customer cards for display
     */
    getCustomerCards(customerId) {
        const customers = this.getStoredCustomers();
        const customer = customers.find(c => c.customerId === customerId);
        return customer ? customer.cards : [];
    }

    /**
     * Search customers by name, email, or phone with enhanced matching
     */
    searchCustomers(query) {
        if (!query || query.trim().length < 1) {
            return this.getStoredCustomers();
        }
        
        const customers = this.getStoredCustomers();
        const searchTerm = query.toLowerCase().trim();
        
        return customers.filter(customer => {
            // Search in name
            const nameMatch = customer.name.toLowerCase().includes(searchTerm);
            
            // Search in email
            const emailMatch = customer.email.toLowerCase().includes(searchTerm);
            
            // Search in phone (if exists)
            const phoneMatch = customer.phone && 
                customer.phone.replace(/[\s\-\(\)\+\.]/g, '').includes(searchTerm.replace(/[\s\-\(\)\+\.]/g, ''));
            
            // Search in card last 4 digits
            const cardMatch = customer.cards && customer.cards.some(card => 
                card.last4 && card.last4.includes(searchTerm)
            );
            
            // Search by customer ID (for admin use)
            const idMatch = customer.customerId.toLowerCase().includes(searchTerm);
            
            return nameMatch || emailMatch || phoneMatch || cardMatch || idMatch;
        }).sort((a, b) => {
            // Sort by relevance - exact matches first, then partial matches
            const aExact = a.name.toLowerCase() === searchTerm || a.email.toLowerCase() === searchTerm;
            const bExact = b.name.toLowerCase() === searchTerm || b.email.toLowerCase() === searchTerm;
            
            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;
            
            // Then sort by most recent activity
            const aLastActivity = Math.max(
                new Date(a.createdAt || 0).getTime(),
                new Date(a.updatedAt || 0).getTime(),
                ...(a.cards || []).map(card => new Date(card.lastUsed || card.createdAt || 0).getTime())
            );
            
            const bLastActivity = Math.max(
                new Date(b.createdAt || 0).getTime(),
                new Date(b.updatedAt || 0).getTime(),
                ...(b.cards || []).map(card => new Date(card.lastUsed || card.createdAt || 0).getTime())
            );
            
            return bLastActivity - aLastActivity;
        });
    }

    /**
     * Get customers with advanced filtering options
     */
    getCustomersFiltered(options = {}) {
        let customers = this.getStoredCustomers();
        
        // Filter by has cards
        if (options.hasCards !== undefined) {
            customers = customers.filter(customer => {
                const hasCards = customer.cards && customer.cards.length > 0;
                return options.hasCards ? hasCards : !hasCards;
            });
        }
        
        // Filter by date range
        if (options.createdAfter) {
            const afterDate = new Date(options.createdAfter);
            customers = customers.filter(customer => 
                new Date(customer.createdAt) >= afterDate
            );
        }
        
        if (options.createdBefore) {
            const beforeDate = new Date(options.createdBefore);
            customers = customers.filter(customer => 
                new Date(customer.createdAt) <= beforeDate
            );
        }
        
        // Sort options
        if (options.sortBy) {
            customers.sort((a, b) => {
                switch (options.sortBy) {
                    case 'name':
                        return a.name.localeCompare(b.name);
                    case 'email':
                        return a.email.localeCompare(b.email);
                    case 'created':
                        return new Date(b.createdAt) - new Date(a.createdAt);
                    case 'cardCount':
                        return (b.cards?.length || 0) - (a.cards?.length || 0);
                    default:
                        return 0;
                }
            });
        }
        
        // Limit results
        if (options.limit && options.limit > 0) {
            customers = customers.slice(0, options.limit);
        }
        
        return customers;
    }

    /**
     * Process payment with saved card
     */
    async processPaymentWithSavedCard(amount, customerId, cardId, customerInfo = {}) {
        if (!this.isInitialized) {
            throw new Error('Square SDK not initialized');
        }

        try {
            // Show processing state
            this.showProcessing(true);

            // Validate that the card exists for this customer
            const customer = this.getCustomerById(customerId);
            if (!customer) {
                throw new Error('Customer not found');
            }
            
            const card = customer.cards?.find(c => c.cardId === cardId);
            if (!card) {
                throw new Error('Payment method not found for this customer');
            }

            // In a real implementation, this would call your backend API
            // which would use the stored card token to process the payment
            const paymentResult = await this.submitSavedCardPayment(amount, customerId, cardId, customerInfo);
            
            if (paymentResult.success) {
                // Update card last used timestamp
                this.updateCardLastUsed(customerId, cardId);
                
                this.showSuccess('Payment processed successfully with saved card!');
                
                return {
                    success: true,
                    transactionId: paymentResult.transactionId,
                    amount: amount,
                    last4: card.last4 || 'Unknown',
                    brand: card.brand || 'Unknown',
                    customerId: customerId,
                    cardId: cardId,
                    customerName: customer.name,
                    customerEmail: customer.email
                };
            } else {
                throw new Error(paymentResult.error || 'Payment processing failed');
            }

        } catch (error) {
            console.error('Saved card payment processing error:', error);
            this.showError(error.message || 'Payment processing failed. Please try again.');
            return {
                success: false,
                error: error.message
            };
        } finally {
            this.showProcessing(false);
        }
    }

    /**
     * Submit payment using saved card (simulated backend call)
     */
    async submitSavedCardPayment(amount, customerId, cardId, customerInfo) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('Processing saved card payment:', {
            amount: amount,
            customerId: customerId,
            cardId: cardId,
            customer: customerInfo
        });

        // Simulate random success/failure for demo
        const isSuccess = Math.random() > 0.1; // 90% success rate for demo
        
        if (isSuccess) {
            return {
                success: true,
                transactionId: 'txn_saved_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11)
            };
        } else {
            return {
                success: false,
                error: 'Payment was declined. Please try a different payment method.'
            };
        }
    }

    /**
     * Delete a saved customer card
     */
    async deleteCustomerCard(customerId, cardId) {
        try {
            // In a real implementation, this would call your backend API
            // which would then call Square's Cards API to delete the card
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Remove from local storage
            const customers = this.getStoredCustomers();
            const customer = customers.find(c => c.customerId === customerId);
            
            if (customer) {
                customer.cards = customer.cards.filter(c => c.cardId !== cardId);
                
                // Remove customer if no cards left
                if (customer.cards.length === 0) {
                    const customerIndex = customers.findIndex(c => c.customerId === customerId);
                    if (customerIndex > -1) {
                        customers.splice(customerIndex, 1);
                    }
                }
                
                localStorage.setItem('square_customers', JSON.stringify(customers));
            }
            
            return { success: true };
            
        } catch (error) {
            console.error('Failed to delete customer card:', error);
            throw error;
        }
    }

    /**
     * Show processing state
     */
    showProcessing(isProcessing) {
        const submitButton = document.getElementById('payment-submit-btn');
        const processingIndicator = document.getElementById('processing-indicator');
        
        if (submitButton) {
            submitButton.disabled = isProcessing;
            submitButton.textContent = isProcessing ? 'Processing...' : 'Process Payment';
        }
        
        if (processingIndicator) {
            processingIndicator.style.display = isProcessing ? 'block' : 'none';
        }
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showMessage(message, 'error');
    }

    /**
     * Show message with specified type
     */
    showMessage(message, type = 'info') {
        const messageContainer = document.getElementById('payment-messages');
        if (!messageContainer) return;

        // Clear existing messages
        messageContainer.innerHTML = '';

        // Create message element
        const messageElement = document.createElement('div');
        messageElement.className = `payment-message payment-message-${type}`;
        messageElement.textContent = message;

        messageContainer.appendChild(messageElement);

        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                if (messageElement.parentNode) {
                    messageElement.parentNode.removeChild(messageElement);
                }
            }, 5000);
        }
    }

    /**
     * Clear all messages
     */
    clearMessages() {
        const messageContainer = document.getElementById('payment-messages');
        if (messageContainer) {
            messageContainer.innerHTML = '';
        }
    }

    /**
     * Reset the payment form
     */
    resetForm() {
        this.clearMessages();
        
        // Reset amount input
        const amountInput = document.getElementById('payment-amount');
        if (amountInput) {
            amountInput.value = '';
        }

        // Reset customer info inputs
        const customerInputs = ['customer-name', 'customer-email'];
        customerInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.value = '';
            }
        });

        // Reinitialize card if needed
        if (this.card) {
            this.card.destroy();
            this.initializeCard().catch(error => {
                console.error('Failed to reinitialize card:', error);
            });
        }
    }

    /**
     * Validate payment form with comprehensive validation
     */
    validatePaymentForm() {
        const errors = [];
        
        // Validate amount with detailed checks
        const amountInput = document.getElementById('payment-amount');
        const amountError = this.validateAmount(amountInput?.value);
        if (amountError) {
            errors.push(amountError);
        }

        // Validate customer name with detailed checks
        const nameInput = document.getElementById('customer-name');
        const nameError = this.validateCustomerName(nameInput?.value);
        if (nameError) {
            errors.push(nameError);
        }

        // Validate customer email with detailed checks
        const emailInput = document.getElementById('customer-email');
        const emailError = this.validateCustomerEmail(emailInput?.value);
        if (emailError) {
            errors.push(emailError);
        }

        // Validate phone number if provided
        const phoneInput = document.getElementById('customer-phone');
        if (phoneInput?.value?.trim()) {
            const phoneError = this.validatePhoneNumber(phoneInput.value);
            if (phoneError) {
                errors.push(phoneError);
            }
        }

        return errors;
    }

    /**
     * Validate payment amount with comprehensive checks
     */
    validateAmount(amount) {
        if (!amount || amount.trim() === '') {
            return 'Payment amount is required';
        }

        const numericAmount = parseFloat(amount);
        
        if (isNaN(numericAmount)) {
            return 'Payment amount must be a valid number';
        }

        if (numericAmount <= 0) {
            return 'Payment amount must be greater than $0.00';
        }

        if (numericAmount < 1.00) {
            return 'Payment amount must be at least $1.00';
        }

        if (numericAmount > 999999.99) {
            return 'Payment amount cannot exceed $999,999.99';
        }

        // Check for too many decimal places
        const decimalPlaces = (amount.split('.')[1] || '').length;
        if (decimalPlaces > 2) {
            return 'Payment amount cannot have more than 2 decimal places';
        }

        return null;
    }

    /**
     * Validate customer name with comprehensive checks
     */
    validateCustomerName(name) {
        if (!name || name.trim() === '') {
            return 'Customer name is required';
        }

        const trimmedName = name.trim();
        
        if (trimmedName.length < 2) {
            return 'Customer name must be at least 2 characters long';
        }

        if (trimmedName.length > 100) {
            return 'Customer name cannot exceed 100 characters';
        }

        // Check for valid characters (letters, spaces, hyphens, apostrophes)
        const namePattern = /^[a-zA-Z\s\-'\.]+$/;
        if (!namePattern.test(trimmedName)) {
            return 'Customer name can only contain letters, spaces, hyphens, and apostrophes';
        }

        // Check for at least one letter
        if (!/[a-zA-Z]/.test(trimmedName)) {
            return 'Customer name must contain at least one letter';
        }

        return null;
    }

    /**
     * Validate customer email with comprehensive checks
     */
    validateCustomerEmail(email) {
        if (!email || email.trim() === '') {
            return 'Customer email is required';
        }

        const trimmedEmail = email.trim();
        
        if (trimmedEmail.length > 254) {
            return 'Email address is too long (maximum 254 characters)';
        }

        // Enhanced email validation
        const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        
        if (!emailPattern.test(trimmedEmail)) {
            return 'Please enter a valid email address';
        }

        // Check for common typos
        const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
        const domain = trimmedEmail.split('@')[1]?.toLowerCase();
        
        if (domain) {
            // Check for common domain typos
            const typoSuggestions = {
                'gmial.com': 'gmail.com',
                'gmai.com': 'gmail.com',
                'yahooo.com': 'yahoo.com',
                'hotmial.com': 'hotmail.com',
                'outlok.com': 'outlook.com'
            };
            
            if (typoSuggestions[domain]) {
                return `Did you mean ${trimmedEmail.replace(domain, typoSuggestions[domain])}?`;
            }
        }

        return null;
    }

    /**
     * Validate phone number with comprehensive checks
     */
    validatePhoneNumber(phone) {
        if (!phone || phone.trim() === '') {
            return null; // Phone is optional
        }

        const trimmedPhone = phone.trim();
        
        // Remove common formatting characters
        const cleanPhone = trimmedPhone.replace(/[\s\-\(\)\+\.]/g, '');
        
        // Check if it's all digits (after removing formatting)
        if (!/^\d+$/.test(cleanPhone)) {
            return 'Phone number can only contain digits, spaces, hyphens, parentheses, and plus sign';
        }

        // Check length (US phone numbers are 10 digits, international can be 7-15)
        if (cleanPhone.length < 7) {
            return 'Phone number is too short (minimum 7 digits)';
        }

        if (cleanPhone.length > 15) {
            return 'Phone number is too long (maximum 15 digits)';
        }

        // For US numbers (10 digits), validate area code
        if (cleanPhone.length === 10) {
            const areaCode = cleanPhone.substring(0, 3);
            if (areaCode.startsWith('0') || areaCode.startsWith('1')) {
                return 'Invalid area code (cannot start with 0 or 1)';
            }
        }

        return null;
    }

    /**
     * Validate email format
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Get payment form data
     */
    getPaymentFormData() {
        const amountInput = document.getElementById('payment-amount');
        const nameInput = document.getElementById('customer-name');
        const emailInput = document.getElementById('customer-email');

        return {
            amount: amountInput ? parseFloat(amountInput.value) * 100 : 0, // Convert to cents
            customerInfo: {
                name: nameInput ? nameInput.value.trim() : '',
                email: emailInput ? emailInput.value.trim() : ''
            }
        };
    }
}

// Global instance
let squarePayments = null;

/**
 * Initialize Square Payments when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', async function() {
    // Only initialize on payment pages
    if (document.getElementById('card-container')) {
        squarePayments = new SquarePayments();
        
        // Make globally accessible
        window.squarePayments = squarePayments;
        
        // Wait for Square SDK to load
        if (typeof Square !== 'undefined') {
            await squarePayments.initializeSquareSDK();
        } else {
            console.error('Square Web Payments SDK not loaded');
        }
    }
});

// Remove the old handlePaymentSubmit function as it's now handled in payments.html

// Remove the old handleSaveCard function as it's now handled in payments.html

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SquarePayments;
}