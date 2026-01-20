/**
 * Payment Routes
 */

import express from 'express';
import { createVnpayUrl, vnpayIPN, vnpayReturn, queryVnpayTransaction, simulatePaymentSuccess } from '../controllers/paymentController.js';

const router = express.Router();

// Create VNPay payment URL
router.post('/create-vnpay-url', createVnpayUrl);

// VNPay IPN callback (server-to-server)
router.get('/vnpay-ipn', vnpayIPN);

// VNPay Return URL (redirect after payment)
router.get('/vnpay-return', vnpayReturn);

// Query VNPay Transaction Status (Query DR)
router.get('/query-transaction/:orderId', queryVnpayTransaction);

// Simulate Payment Success (for demo/testing only)
router.post('/simulate-success/:orderId', simulatePaymentSuccess);

export default router;
