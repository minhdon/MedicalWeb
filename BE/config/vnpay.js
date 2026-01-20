/**
 * VNPay Configuration
 */

export const vnpayConfig = {
    vnp_TmnCode: process.env.VNPAY_TMN_CODE || '865JSA63',
    vnp_HashSecret: process.env.VNPAY_HASH_SECRET || 'L7Q57DG321KGWTWHMPG1PT24FLXQKMCO',
    vnp_Url: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    vnp_ReturnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:3000/api/payment/vnpay-return',
    vnp_Api: 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction'
};

export default vnpayConfig;
