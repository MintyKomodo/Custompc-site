# Design Document - Square Payment Integration

## Overview

This design document outlines the integration of Square payment processing into the existing CustomPC.tech website. The system will add secure payment capabilities accessible only to authenticated administrators, leveraging Square's Web Payments SDK for PCI-compliant payment processing and customer card storage.

The integration will extend the existing authentication system to include admin-level permissions and add a new "Payments" navigation page where administrators can process payments and manage customer payment methods.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client Web    │    │   Payment Page   │    │   Square API    │
│   Application   │◄──►│   (Admin Only)   │◄──►│   Services      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Authentication │    │   Payment UI     │    │  Card Storage   │
│     System      │    │   Components     │    │   (Square)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Component Architecture

1. **Authentication Layer**: Extended existing auth system with admin role validation
2. **Payment Interface**: New payment page with Square Web Payments SDK integration
3. **Navigation Integration**: Dynamic navigation menu showing Payments option for admins
4. **Square Integration**: Direct API communication for payment processing and card storage

## Components and Interfaces

### 1. Enhanced Authentication System

**File**: `admin-auth.js`
- Extends existing `SharedAuth` class
- Validates admin credentials against hardcoded values
- Manages admin session state
- Controls access to payment functionality

**Key Methods**:
```javascript
class AdminAuth extends SharedAuth {
  validateAdminCredentials(username, password, email)
  isCurrentUserAdmin()
  requireAdminAccess()
}
```

### 2. Payment Page Component

**File**: `payments.html`
- Dedicated admin-only payment processing page
- Integrates Square Web Payments SDK
- Provides payment form and customer management interface
- Displays payment history and saved customer cards

**Key Features**:
- Payment amount input and processing
- Customer information collection
- Saved payment methods display
- Payment confirmation and error handling

### 3. Square Integration Module

**File**: `square-payments.js`
- Handles Square Web Payments SDK initialization
- Manages payment processing workflow
- Handles customer card storage and retrieval
- Provides error handling and status feedback

**Key Methods**:
```javascript
class SquarePayments {
  initializeSquareSDK()
  processPayment(amount, customerInfo)
  saveCustomerCard(cardData, customerInfo)
  retrieveCustomerCards(customerId)
  handlePaymentResult(result)
}
```

### 4. Navigation Enhancement

**File**: Enhanced `shared-auth.js`
- Adds conditional "Payments" navigation item
- Shows/hides based on admin authentication status
- Integrates with existing navigation structure

## Data Models

### Admin User Model
```javascript
{
  username: "Minty-Komodo",
  password: "hJ.?'0PcU0).1.0.1PCimA4%oU", // Hashed in production
  email: "griffin@crowhurst.ws",
  role: "admin",
  loginTime: "ISO timestamp"
}
```

### Payment Transaction Model
```javascript
{
  transactionId: "string",
  amount: "number (cents)",
  currency: "USD",
  customerId: "string",
  customerName: "string",
  customerEmail: "string",
  paymentMethod: "card",
  cardLast4: "string",
  status: "completed|failed|pending",
  timestamp: "ISO timestamp",
  squarePaymentId: "string"
}
```

### Customer Card Model (Stored in Square)
```javascript
{
  customerId: "string",
  cardId: "string", // Square card token
  last4: "string",
  brand: "visa|mastercard|amex|discover",
  expirationMonth: "number",
  expirationYear: "number",
  customerName: "string",
  billingAddress: "object"
}
```

## Square Web Payments SDK Integration

### SDK Configuration
```javascript
const payments = Square.payments(applicationId, locationId);
```

### Payment Flow
1. Initialize Square Web Payments SDK with application credentials
2. Create payment form with card input fields
3. Tokenize payment method on form submission
4. Process payment through Square Payments API
5. Handle payment result and update UI
6. Optionally save customer card for future use

### Card Storage Flow
1. Collect customer information alongside payment
2. Create customer record in Square if new
3. Store card token associated with customer
4. Display saved cards for future transactions

## Error Handling

### Authentication Errors
- Invalid admin credentials → Redirect to login with error message
- Session timeout → Clear session and redirect to login
- Unauthorized access → Display access denied message

### Payment Processing Errors
- Invalid card information → Display field-specific validation errors
- Payment declined → Show user-friendly decline message
- Network errors → Display retry option with error details
- Square API errors → Log technical details, show generic user message

### Integration Errors
- Square SDK load failure → Fallback to manual card entry form
- Configuration errors → Admin notification system
- Missing environment variables → Graceful degradation

## Testing Strategy

### Unit Testing
- Admin authentication validation functions
- Payment form validation logic
- Square SDK integration methods
- Error handling scenarios

### Integration Testing
- End-to-end payment processing flow
- Admin authentication and authorization
- Navigation menu updates based on auth state
- Square API communication

### Security Testing
- Admin credential validation
- Payment data handling (ensure no local storage of sensitive data)
- Session management and timeout
- HTTPS enforcement for payment pages

### User Acceptance Testing
- Admin login and payment page access
- Payment processing with test cards
- Customer card saving and retrieval
- Error scenarios and user feedback

## Security Considerations

### PCI Compliance
- All payment data handled by Square's PCI-compliant infrastructure
- No sensitive card data stored locally
- Use Square's tokenization for card storage
- HTTPS required for all payment-related pages

### Authentication Security
- Admin credentials stored securely (hashed passwords in production)
- Session timeout implementation
- Secure session storage
- Protection against brute force attacks

### Data Protection
- Customer information encrypted in transit
- Minimal data retention policy
- Secure API key management
- Regular security audits

## Performance Considerations

### Page Load Optimization
- Lazy load Square SDK only on payment pages
- Minimize JavaScript bundle size
- Optimize payment form rendering
- Cache static payment page assets

### API Efficiency
- Batch customer card retrieval when possible
- Implement request caching for customer data
- Optimize payment processing flow
- Handle concurrent payment requests

## Deployment Configuration

### Environment Variables
```
SQUARE_APPLICATION_ID=sandbox-sq0idb-G9gb7bgmLJetrPtT_Whjo
SQUARE_ACCESS_TOKEN=EAAAlz2q9IRcBf10fWh0WvlbNkuRfQK_xhP8TUWfBLDya6tfVYieHaTrMX-BL0Kd
SQUARE_LOCATION_ID=LJR87MYZ8ZZC9
SQUARE_ENVIRONMENT=sandbox|production
```

### File Structure
```
/
├── payments.html (new)
├── js/
│   ├── admin-auth.js (new)
│   ├── square-payments.js (new)
│   └── shared-auth.js (enhanced)
├── css/
│   └── payment-styles.css (new)
└── .env (configuration)
```

### CDN Dependencies
- Square Web Payments SDK: `https://sandbox.web.squarecdn.com/v1/square.js`
- Production: `https://web.squarecdn.com/v1/square.js`

## Integration Points

### Existing Authentication System
- Extend `SharedAuth` class for admin validation
- Maintain compatibility with existing user sessions
- Add admin role checking to navigation logic

### Navigation System
- Conditionally display "Payments" menu item
- Integrate with existing navigation styling
- Maintain responsive design principles

### Styling Integration
- Use existing CSS custom properties and design system
- Maintain consistent visual hierarchy
- Ensure payment forms match site aesthetics
- Responsive design for mobile payment processing