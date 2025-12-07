import mongoose from 'mongoose'

const saleInvoiceDetailSchema = new mongoose.Schema({
    saleInvoiceId: {type: mongoose.Schema.Types.ObjectId, ref: 'SaleInvoice', required: true},
    batchId: {type: mongoose.Schema.Types.ObjectId, ref: 'ProductBatch', required: true},
    productId: {type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true},
    quantity: {type: Number, required: true},
    unitPrice: {type: Number, required: true},
    totalPrice: {type: Number, required: true}
}, {timestamps: true});

saleInvoiceDetailSchema.index(
    {saleInvoiceId: 1, batchId: 1, productId: 1},
    {unique: true}
)

export const SaleInvoiceDetail = mongoose.model('SaleInvoiceDetail', saleInvoiceDetailSchema)