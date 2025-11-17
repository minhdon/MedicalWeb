import mongoose from 'mongoose'

const productBatchSchema = new mongoose.Schema({
    batchId: {type: String, require: true, index: true, unique: true},
    productId: {type: String, ref: 'Product', require: true},
    purchaseInvoiceId: {type: String, ref: 'PurchaseInvoice', require: true},
    manufactureDate: {type: Date, require: true}, 
    expiryDate: {type: Date, require: true},
    quantity: {type: Number},
    remainingQuantity: {type: Number},
    dosage: {type: String, require: true},
    administration: {type: String, require: true}
}, {timestamps: true});

export const ProductBatch = mongoose.Model('ProductBatch', productBatchSchema)