import mongoose from 'mongoose'

const saleInvoiceSchema = new mongoose.Schema({
    saleInvoiceId: {type: String, require: true, index: true, unique: true},
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', require: true},
    saleDate: {type: Date, require: true},
    statusId: {type: String, ref: 'OrderStatus', require: true}
}, {timestamps: true});

export const SaleInvoice = mongoose.Model('SaleInvoice', saleInvoiceSchema)