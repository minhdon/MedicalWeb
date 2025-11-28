import mongoose from 'mongoose'

const productBatchSchema = new mongoose.Schema({
    productId: {type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true},
    purchaseInvoiceId: {type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseInvoice', required: true},
    manufactureDate: {type: Date, required: true},
    expiryDate: {type: Date, required: true},
    quantity: {type: Number, required: true},
    remainingQuantity: {type: Number, required: true},
    dosage: {type: String, required: true},
    administration: {type: String, required: true}
}, {timestamps: true});

export const ProductBatch = mongoose.model('ProductBatch', productBatchSchema)