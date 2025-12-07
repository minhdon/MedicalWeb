import mongoose from 'mongoose'

const purchaseInvoiceDetailSchema = new mongoose.Schema({
    purchaseInvoiceId: {type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseInvoice', required: true},
    productId: {type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true},
    quantity: {type: Number, required: true},
    unitPrice: {type: Number, required: true},
    totalPrice: {type: Number, required: true}
}, {timestamps: true});

purchaseInvoiceDetailSchema.index(
    {purchaseInvoiceId: 1, productId: 1},
    {unique: true}
)

export const PurchaseInvoiceDetail = mongoose.model('PurchaseInvoiceDetail', purchaseInvoiceDetailSchema)