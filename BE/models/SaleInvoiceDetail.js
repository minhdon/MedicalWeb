import mongoose from 'mongoose'

const saleInvoiceDetailSchema = new mongoose.Schema({
    saleInvoiceId: {type: String, ref: 'SaleInvoice', require: true},
    batchId: {type: String, ref: 'ProductBatch', require: true},
    productId: {type: String, ref: 'Product', require: true},
    quantity: {type: Number, require: true},
    unitPrice: {type: Number, require: true},
    totalPrice: {type: Number, require: true}
}, {timestamps: true});

saleInvoiceDetailSchema.index(
    {saleInvoiceId: 1, batchId: 1, productId: 1},
    {unique: true}
)

export const SaleInvoiceDetail = mongoose.Model('SaleInvoiceDetail', saleInvoiceDetailSchema)