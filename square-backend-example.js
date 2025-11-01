/**
 * Example Node.js Backend for Square Payment Processing
 * This shows what your backend API should look like
 */

const express = require('express');
const SquareConnect = require('square-connect');
const crypto = require('crypto');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Serve static files (your HTML/CSS/JS)
app.use(express.static('.'));

// Initialize Square client
const defaultClient = SquareConnect.ApiClient.instance;
const oauth2 = defaultClient.authentications['oauth2'];
oauth2.accessToken = process.env.SQUARE_ACCESS_TOKEN || 'EAAAl9-n6xL-VukQrSJWp3hJCvxWres3IgFnf2nFLEENmUC-aHrC3OQh9OlvcM76';

// Set to production environment
defaultClient.basePath = 'https://connect.squareup.com';

console.log('🔧 Square client initialized for production environment');

// Initialize API instances
const paymentsApi = new SquareConnect.PaymentsApi();
const customersApi = new SquareConnect.CustomersApi();
const cardsApi = new SquareConnect.CardsApi();

/**
 * Process a payment with Square
 */
app.post('/api/payments/process', async (req, res) => {
  try {
    const { sourceId, amount, customerInfo, idempotencyKey } = req.body;

    // Validate required fields
    if (!sourceId || !amount || !customerInfo) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sourceId, amount, customerInfo'
      });
    }

    // Create payment request
    const paymentRequest = new SquareConnect.CreatePaymentRequest();
    paymentRequest.source_id = sourceId;
    paymentRequest.amount_money = new SquareConnect.Money();
    paymentRequest.amount_money.amount = amount; // Amount in cents
    paymentRequest.amount_money.currency = 'USD';
    paymentRequest.idempotency_key = idempotencyKey || crypto.randomUUID();
    paymentRequest.buyer_email_address = customerInfo.email;
    paymentRequest.note = `Payment for CustomPC.tech - ${customerInfo.name}`;
    paymentRequest.location_id = process.env.SQUARE_LOCATION_ID;

    // Process payment
    const response = await paymentsApi.createPayment(paymentRequest);

    if (response.result.payment) {
      res.json({
        success: true,
        transactionId: response.result.payment.id,
        amount: response.result.payment.amountMoney.amount,
        status: response.result.payment.status,
        receiptUrl: response.result.payment.receiptUrl
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Payment processing failed'
      });
    }

  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * Create or retrieve customer
 */
app.post('/api/customers/create-or-get', async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    // Search for existing customer by email
    const searchQuery = {
      filter: {
        emailAddress: {
          exact: email
        }
      }
    };

    const searchResponse = await customersApi.searchCustomers({ query: searchQuery });
    
    if (searchResponse.result.customers && searchResponse.result.customers.length > 0) {
      // Customer exists
      res.json({
        success: true,
        customer: searchResponse.result.customers[0]
      });
    } else {
      // Create new customer
      const createRequest = {
        givenName: name.split(' ')[0],
        familyName: name.split(' ').slice(1).join(' '),
        emailAddress: email,
        phoneNumber: phone
      };

      const createResponse = await customersApi.createCustomer(createRequest);
      
      res.json({
        success: true,
        customer: createResponse.result.customer
      });
    }

  } catch (error) {
    console.error('Customer creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create customer'
    });
  }
});

/**
 * Save card to customer
 */
app.post('/api/customers/:customerId/cards', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { cardNonce } = req.body;

    const request = {
      cardNonce: cardNonce
    };

    const response = await cardsApi.createCard(request);

    if (response.result.card) {
      res.json({
        success: true,
        card: response.result.card
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to save card'
      });
    }

  } catch (error) {
    console.error('Card creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to save card'
    });
  }
});

/**
 * Process payment with saved card
 */
app.post('/api/payments/process-saved-card', async (req, res) => {
  try {
    const { customerId, cardId, amount, customerInfo, idempotencyKey } = req.body;

    const paymentRequest = {
      sourceId: cardId,
      amountMoney: {
        amount: amount,
        currency: 'USD'
      },
      idempotencyKey: idempotencyKey || crypto.randomUUID(),
      customerId: customerId,
      buyerEmailAddress: customerInfo.email,
      note: `Payment for CustomPC.tech - ${customerInfo.name}`,
      locationId: process.env.SQUARE_LOCATION_ID
    };

    const response = await paymentsApi.createPayment(paymentRequest);

    if (response.result.payment) {
      res.json({
        success: true,
        transactionId: response.result.payment.id,
        amount: response.result.payment.amountMoney.amount,
        status: response.result.payment.status,
        receiptUrl: response.result.payment.receiptUrl
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Payment processing failed'
      });
    }

  } catch (error) {
    console.error('Saved card payment error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Payment processing failed'
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Square payment server running on port ${PORT}`);
});

module.exports = app;