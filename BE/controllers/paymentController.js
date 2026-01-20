/**
 * VNPay Payment Controller
 */

import crypto from 'crypto';
import querystring from 'qs';
import { vnpayConfig } from '../config/vnpay.js';
import { SaleInvoice } from '../models/saleInvoice/SaleInvoice.js';
import { OrderStatus } from '../models/saleInvoice/OrderStatus.js';
import { restoreStockForOrder } from './saleInvoiceController.js';
import mongoose from 'mongoose';

// Sort object by key alphabetically (Standard for Create URL)
function sortObject(obj) {
    let sorted = {};
    let keys = Object.keys(obj).sort();
    for (let key of keys) {
        sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, '+');
    }
    return sorted;
}

// Sort object for Return/IPN (Handles special characters like parens consistent with VNPay return)
function sortObjectForReturn(obj) {
    let sorted = {};
    let keys = Object.keys(obj).sort();
    for (let key of keys) {
        sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, '+').replace(/\(/g, '%28').replace(/\)/g, '%29');
    }
    return sorted;
}

/**
 * Create VNPay Payment URL
 * POST /api/payment/create-vnpay-url
 */
export const createVnpayUrl = async (req, res) => {
    try {
        const { orderId, amount, orderInfo, bankCode } = req.body;

        if (!orderId || !amount) {
            return res.status(400).json({ message: 'orderId và amount là bắt buộc' });
        }

        // Get client IP
        let ipAddr = req.headers['x-forwarded-for'] ||
            req.connection?.remoteAddress ||
            req.socket?.remoteAddress ||
            '127.0.0.1';

        // Create date in format yyyyMMddHHmmss
        const date = new Date();
        const createDate = date.getFullYear().toString() +
            String(date.getMonth() + 1).padStart(2, '0') +
            String(date.getDate()).padStart(2, '0') +
            String(date.getHours()).padStart(2, '0') +
            String(date.getMinutes()).padStart(2, '0') +
            String(date.getSeconds()).padStart(2, '0');

        // Build VNPay params
        let vnp_Params = {
            vnp_Version: '2.1.0',
            vnp_Command: 'pay',
            vnp_TmnCode: vnpayConfig.vnp_TmnCode,
            vnp_Locale: 'vn',
            vnp_CurrCode: 'VND',
            vnp_TxnRef: orderId,
            vnp_OrderInfo: orderInfo || `Thanh toan don hang ${orderId}`,
            vnp_OrderType: 'other',
            vnp_Amount: amount * 100, // VNPay requires amount * 100
            vnp_ReturnUrl: vnpayConfig.vnp_ReturnUrl,
            vnp_IpAddr: ipAddr,
            vnp_CreateDate: createDate
        };

        // Optional: Add bank code if specified
        if (bankCode) {
            vnp_Params.vnp_BankCode = bankCode;
        }

        // Sort params alphabetically
        vnp_Params = sortObject(vnp_Params);

        // Create signature
        const signData = querystring.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
        vnp_Params.vnp_SecureHash = signed;

        // Build payment URL
        const paymentUrl = vnpayConfig.vnp_Url + '?' + querystring.stringify(vnp_Params, { encode: false });

        console.log('VNPay URL created for order:', orderId);

        res.status(200).json({
            code: '00',
            message: 'success',
            paymentUrl
        });

    } catch (error) {
        console.error('Create VNPay URL Error:', error);
        res.status(500).json({ message: 'Lỗi tạo URL thanh toán' });
    }
};

/**
 * VNPay IPN (Instant Payment Notification) - Server to Server callback
 * GET /api/payment/vnpay-ipn
 */
export const vnpayIPN = async (req, res) => {
    try {
        let vnp_Params = req.query;
        const secureHash = vnp_Params.vnp_SecureHash;

        // Remove hash fields for verification
        delete vnp_Params.vnp_SecureHash;
        delete vnp_Params.vnp_SecureHashType;

        vnp_Params = sortObjectForReturn(vnp_Params);

        const signData = querystring.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        // Verify checksum
        if (secureHash !== signed) {
            console.log('VNPay IPN: Invalid checksum', { received: secureHash, calculated: signed });
            return res.status(200).json({ RspCode: '97', Message: 'Invalid checksum' });
        }

        const orderId = vnp_Params.vnp_TxnRef;
        const rspCode = vnp_Params.vnp_ResponseCode;
        const transactionNo = vnp_Params.vnp_TransactionNo;
        const payDate = vnp_Params.vnp_PayDate;
        const amount = parseInt(vnp_Params.vnp_Amount) / 100;

        // Find order
        const order = await SaleInvoice.findById(orderId);
        if (!order) {
            console.log('VNPay IPN: Order not found:', orderId);
            return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
        }

        // Check if already processed
        if (order.paymentStatus === 'paid') {
            console.log('VNPay IPN: Order already paid:', orderId);
            return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
        }

        // Check amount
        if (order.totalAmount !== amount) {
            console.log('VNPay IPN: Amount mismatch:', { expected: order.totalAmount, received: amount });
            return res.status(200).json({ RspCode: '04', Message: 'Invalid amount' });
        }




        // Update order based on response code
        if (rspCode === '00') {
            // Payment successful
            order.paymentStatus = 'paid';
            order.paymentMethod = 'VNPay';
            order.vnpayTransactionNo = transactionNo;
            order.vnpayPayDate = payDate;

            // Update Order Status to 'Confirmed'
            const confirmedStatus = await OrderStatus.findOne({ statusName: 'Confirmed' });
            if (confirmedStatus) {
                order.statusId = confirmedStatus._id;
            }

            await order.save();

            console.log('VNPay IPN: Payment successful for order:', orderId);
            return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
        } else {
            // Payment failed
            order.paymentStatus = 'failed';

            // Update Order Status to 'Cancelled'
            const cancelledStatus = await OrderStatus.findOne({ statusName: 'Cancelled' });

            // If status is not already Cancelled, restore stock
            if (cancelledStatus && order.statusId?.toString() !== cancelledStatus._id.toString()) {
                order.statusId = cancelledStatus._id;

                // Restore Stock
                const session = await mongoose.startSession();
                session.startTransaction();
                try {
                    await restoreStockForOrder(orderId, session);
                    await session.commitTransaction();
                } catch (err) {
                    console.error('Error restoring stock in IPN:', err);
                    await session.abortTransaction();
                    // Continued even if stock restore fails? Maybe Log it.
                } finally {
                    session.endSession();
                }
            }

            await order.save();

            console.log('VNPay IPN: Payment failed for order:', orderId, 'Code:', rspCode);
            return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
        }

    } catch (error) {
        console.error('VNPay IPN Error:', error);
        return res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
    }
};

/**
 * VNPay Return URL - Redirect user after payment
 * GET /api/payment/vnpay-return
 */
export const vnpayReturn = async (req, res) => {
    try {
        let vnp_Params = req.query;
        const secureHash = vnp_Params.vnp_SecureHash;

        delete vnp_Params.vnp_SecureHash;
        delete vnp_Params.vnp_SecureHashType;

        vnp_Params = sortObjectForReturn(vnp_Params);

        const signData = querystring.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        const orderId = vnp_Params.vnp_TxnRef;
        const rspCode = vnp_Params.vnp_ResponseCode;
        const transactionNo = vnp_Params.vnp_TransactionNo;
        const payDate = vnp_Params.vnp_PayDate;

        if (secureHash === signed) {
            // Find order
            const order = await SaleInvoice.findById(orderId);
            if (!order) {
                return res.redirect(`http://localhost:5173/payment-result?status=error&message=Order+not+found`);
            }

            if (rspCode === '00') {
                // Success
                if (order.paymentStatus !== 'paid') {
                    order.paymentStatus = 'paid';
                    order.paymentMethod = 'VNPay';
                    order.vnpayTransactionNo = transactionNo;
                    order.vnpayPayDate = payDate;

                    const confirmedStatus = await OrderStatus.findOne({ statusName: 'Confirmed' });
                    if (confirmedStatus) order.statusId = confirmedStatus._id;

                    await order.save();
                }
                // Redirect to success page
                res.redirect(`http://localhost:5173/payment-result?status=success&orderId=${orderId}`);
            } else {
                // Fail logic (Cancel order & Restore stock)
                console.log('VNPay Return: Processing failed payment for order:', orderId, 'Code:', rspCode);

                const cancelledStatus = await OrderStatus.findOne({ statusName: 'Cancelled' });
                console.log('VNPay Return: Cancelled status found:', cancelledStatus);
                console.log('VNPay Return: Current order statusId:', order.statusId?.toString());

                if (!cancelledStatus) {
                    console.error('VNPay Return: ERROR - Cancelled status not found in database!');
                }

                if (cancelledStatus && order.statusId?.toString() !== cancelledStatus._id.toString()) {
                    console.log('VNPay Return: Updating order status to Cancelled...');
                    order.paymentStatus = 'failed';
                    order.statusId = cancelledStatus._id;

                    // Restore Stock
                    const session = await mongoose.startSession();
                    session.startTransaction();
                    try {
                        await restoreStockForOrder(orderId, session);
                        await session.commitTransaction();
                        console.log('VNPay Return: Stock restored successfully');
                    } catch (err) {
                        console.error('Error restoring stock in Return URL:', err);
                        await session.abortTransaction();
                    } finally {
                        session.endSession();
                    }

                    await order.save();
                    console.log('VNPay Return: Order saved with status:', order.statusId);
                } else {
                    console.log('VNPay Return: Order already cancelled or cancelledStatus not found, skipping update');
                }

                // Redirect to failed page
                res.redirect(`http://localhost:5173/payment-result?status=failed&orderId=${orderId}&code=${rspCode}`);
            }
        } else {
            res.redirect(`http://localhost:5173/payment-result?status=error&message=Invalid+checksum`);
        }

    } catch (error) {
        console.error('VNPay Return Error:', error);
        res.redirect(`http://localhost:5173/payment-result?status=error&message=Unknown+error`);
    }
};

/**
 * Query VNPay Transaction Status (Query DR)
 * GET /api/payment/query-transaction/:orderId
 */
export const queryVnpayTransaction = async (req, res) => {
    try {
        const { orderId } = req.params;

        // 1. Find Order
        const order = await SaleInvoice.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // 2. Prepare Query DR Params
        const date = new Date();
        const createDate = date.getFullYear().toString() +
            String(date.getMonth() + 1).padStart(2, '0') +
            String(date.getDate()).padStart(2, '0') +
            String(date.getHours()).padStart(2, '0') +
            String(date.getMinutes()).padStart(2, '0') +
            String(date.getSeconds()).padStart(2, '0');

        const vnp_RequestId = date.getTime(); // Unique Request ID
        const vnp_Version = '2.1.0';
        const vnp_Command = 'querydr';
        const vnp_TmnCode = vnpayConfig.vnp_TmnCode;
        const vnp_TxnRef = orderId;
        const vnp_OrderInfo = `Query transaction ${orderId}`;

        // Transaction Date (required) - Use Order creation date formatted
        const orderDate = new Date(order.saleDate);
        const vnp_TransactionDate = orderDate.getFullYear().toString() +
            String(orderDate.getMonth() + 1).padStart(2, '0') +
            String(orderDate.getDate()).padStart(2, '0') +
            String(orderDate.getHours()).padStart(2, '0') +
            String(orderDate.getMinutes()).padStart(2, '0') +
            String(orderDate.getSeconds()).padStart(2, '0');

        const vnp_IpAddr = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '127.0.0.1';

        let vnp_Params = {
            vnp_RequestId,
            vnp_Version,
            vnp_Command,
            vnp_TmnCode,
            vnp_TxnRef,
            vnp_OrderInfo,
            vnp_TransactionDate,
            vnp_CreateDate: createDate,
            vnp_IpAddr
        };

        // 3. Create Signature
        // Query DR signature format: requestId|version|command|tmnCode|txnRef|transDate|createDate|ipAddr|orderInfo
        const signData = [
            vnp_RequestId,
            vnp_Version,
            vnp_Command,
            vnp_TmnCode,
            vnp_TxnRef,
            vnp_TransactionDate,
            createDate,
            vnp_IpAddr,
            vnp_OrderInfo
        ].join('|');

        const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
        vnp_Params.vnp_SecureHash = signed;

        // 4. Send Request to VNPay
        console.log('Sending Query DR to VNPay:', vnp_Params);

        const response = await fetch(vnpayConfig.vnp_Api, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(vnp_Params)
        });

        const data = await response.json();
        console.log('VNPay Query DR Response:', data);

        // 5. Process Response
        if (data.vnp_ResponseCode === '00') {
            const transactionStatus = data.vnp_TransactionStatus;

            // 00: Successful
            if (transactionStatus === '00') {
                if (order.paymentStatus !== 'paid') {
                    order.paymentStatus = 'paid';
                    order.paymentMethod = 'VNPay';
                    order.vnpayTransactionNo = data.vnp_TransactionNo;
                    order.vnpayPayDate = data.vnp_PayDate;

                    const confirmedStatus = await OrderStatus.findOne({ statusName: 'Confirmed' });
                    if (confirmedStatus) order.statusId = confirmedStatus._id;

                    await order.save();
                    return res.status(200).json({ message: 'Transaction confirmed successfully', data });
                } else {
                    return res.status(200).json({ message: 'Transaction already confirmed', data });
                }
            }
            // 01: Incomplete (Pending) - Do nothing
            else if (transactionStatus === '01') {
                return res.status(200).json({ message: 'Transaction is pending', data });
            }
            // 02: Failed / Cancelled
            else {
                const cancelledStatus = await OrderStatus.findOne({ statusName: 'Cancelled' });

                if (cancelledStatus && order.statusId?.toString() !== cancelledStatus._id.toString()) {
                    order.paymentStatus = 'failed';
                    order.statusId = cancelledStatus._id;

                    // Restore Stock
                    const session = await mongoose.startSession();
                    session.startTransaction();
                    try {
                        await restoreStockForOrder(orderId, session);
                        await session.commitTransaction();
                    } catch (err) {
                        console.error('Error restoring stock in Query DR:', err);
                        await session.abortTransaction();
                    } finally {
                        session.endSession();
                    }

                    await order.save();
                    return res.status(200).json({ message: 'Transaction failed/cancelled', data });
                }
            }
        }

        return res.status(200).json({ message: 'Query completed', data });

    } catch (error) {
        console.error('Query VNPay Transaction Error:', error);
        res.status(500).json({ message: 'Error querying transaction' });
    }
};
