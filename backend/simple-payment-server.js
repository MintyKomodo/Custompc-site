/**
 * Simple Payment Server for Square Integration
 * This is a minimal working backend for your Square payments
 */

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Serve static files (your HTML/CSS/JS)
app.use(express.static('../')); // Serve from parent directory to access all files

// Your Square credentials
const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN || 'EAAAl9-n6xL-VukQrSJWp3hJCvxWres3IgFnf2nFLEENmUC-aHrC3OQh9OlvcM76';
const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID || 'LJR87MYZ8ZZC9';

/**
 * Process payment endpoint
 */
app.post('/api/payments/process', async (req, res) => {
  try {
    const { sourceId, amount, customerInfo, idempotencyKey } = req.body;

    console.log('Processing payment:', {
      sourceId: sourceId ? 'present' : 'missing',
      amount,
      customerName: customerInfo?.name,
      customerEmail: customerInfo?.email
    });

    // Validate required fields
    if (!sourceId || !amount || !customerInfo) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sourceId, amount, customerInfo'
      });
    }

    // Make request to Square API
    const paymentData = {
      source_id: sourceId,
      amount_money: {
        amount: parseInt(amount),
        currency: 'USD'
      },
      idempotency_key: idempotencyKey || crypto.randomUUID(),
      buyer_email_address: customerInfo.email,
      note: `Payment for CustomPC.tech - ${customerInfo.name}`,
      location_id: SQUARE_LOCATION_ID
    };

    const response = await fetch('https://connect.squareup.com/v2/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
        'Square-Version': '2023-10-18',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });

    const result = await response.json();

    if (response.ok && result.payment) {
      console.log('✅ Payment successful:', result.payment.id);
      
      res.json({
        success: true,
        transactionId: result.payment.id,
        amount: result.payment.amount_money.amount,
        status: result.payment.status,
        receiptUrl: result.payment.receipt_url || null,
        last4: result.payment.card_details?.card?.last_4 || 'Unknown'
      });
    } else {
      console.error('❌ Payment failed:', result);
      
      const errorMessage = result.errors && result.errors.length > 0 
        ? result.errors[0].detail 
        : 'Payment processing failed';
      
      res.status(400).json({
        success: false,
        error: errorMessage
      });
    }

  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: 'production',
    squareConfigured: !!SQUARE_ACCESS_TOKEN && !!SQUARE_LOCATION_ID,
    timestamp: new Date().toISOString()
  });
});

/**
 * Test Square connection
 */
app.get('/api/test-square', async (req, res) => {
  try {
    const response = await fetch(`https://connect.squareup.com/v2/locations/${SQUARE_LOCATION_ID}`, {
      headers: {
        'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
        'Square-Version': '2023-10-18'
      }
    });

    const result = await response.json();

    if (response.ok) {
      res.json({
        success: true,
        location: result.location,
        message: 'Square connection successful'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.errors || 'Square connection failed'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Payment server running on http://localhost:${PORT}`);
  console.log(`📊 Admin panel: http://localhost:${PORT}/payments.html`);
  console.log(`🔧 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🧪 Test Square: http://localhost:${PORT}/api/test-square`);
});

module.exports = app;