import mongoose from 'mongoose'

const purchaseInvoiceDetailSchema = new mongoose.Schema({
    purchaseInvoiceId: {type: String, ref: 'PurchaseInvoice', require: true},
    productId: {type: String, ref: 'Product', require: true},
    quantity: {type: Number, require: true},
    unitPrice: {type: Number, require: true},
    totalPrice: {type: Number, require: true}
}, {timestamps: true});

purchaseInvoiceDetailSchema.index(
    {purchaseInvoiceId: 1, productId: 1},
    {unique: true}
)

export const PurchaseInvoiceDetail = mongoose.Model('PurchaseInvoiceDetail', purchaseInvoiceDetailSchema)