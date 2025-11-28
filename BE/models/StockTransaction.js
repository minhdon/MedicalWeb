import mongoose from 'mongoose'

const stockTransactionSchema = new mongoose.Schema({
    batchId: {type: mongoose.Schema.Types.ObjectId, ref: 'ProductBatch', required: true},
    warehouseId: {type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true},
    transactionType: {type: String, enum: ['IMPORT', 'EXPORT', 'ADJUST'], required: true},
    quantity: {type: Number, required: true},
    transactionDate: {type: Date, required: true, default: Date.now},
    relatedInvoiceId: {type: mongoose.Schema.Types.ObjectId}
}, {timestamps: true});

export const StockTransaction = mongoose.model('StockTransaction', stockTransactionSchema)