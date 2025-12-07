import mongoose from 'mongoose'

const paymentSchema = new mongoose.Schema({
    saleInvoiceId: {type: mongoose.Schema.Types.ObjectId, ref: 'SaleInvoice', required: true},
    transactionId: {type: mongoose.Schema.Types.ObjectId, ref: 'StockTransaction', required: true},
    paymentMethod: {type: String, enum: ['Momo', 'ZaloPay', 'VNPAY', 'Cash']},
    amount: {type: Number, required: true},
    paymentStatus: {type: String, enum: ['Pending', 'Success', 'Failed', 'Refunded'], default: 'Pending'},
    paymentDate: {type: Date, required: true, default: Date.now}
}, {timestamps: true});

export const Payment = mongoose.model('Payment', paymentSchema)