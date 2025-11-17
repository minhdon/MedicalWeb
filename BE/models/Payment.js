import mongoose from 'mongoose'

const paymentSchema = new mongoose.Schema({
    paymentId: {type: String, require: true, index: true, unique: true},
    saleInvoiceId: {type: String, ref: 'SaleInvoice', require: true},
    transactionId: {type: String, ref: 'StockTransaction', require: true},
    paymentMethod: {type: String, Enumerator: ['Momo', 'ZaloPay', 'VNPAY']},
    amount: {type: Number, require: true},
    paymentStatus: {type: String, Enumerator: ['Pending', 'Success', 'Failed', 'Refunded']},
    paymentDate: {type: Date, require: true}
}, {timestamps: true});

export const Payment = mongoose.Model('Payment', paymentSchema)