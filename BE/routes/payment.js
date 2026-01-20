/**
 * Payment Routes
 */

import express from 'express';
import { createVnpayUrl, vnpayIPN, vnpayReturn, queryVnpayTransaction } from '../controllers/paymentController.js';

const router = express.Router();

// Create VNPay payment URL
router.post('/create-vnpay-url', createVnpayUrl);

// VNPay IPN callback (server-to-server)
router.get('/vnpay-ipn', vnpayIPN);

// VNPay Return URL (redirect after payment)
router.get('/vnpay-return', vnpayReturn);

// Query VNPay Transaction Status (Query DR)
router.get('/query-transaction/:orderId', queryVnpayTransaction);

export default router;
