import mongoose from 'mongoose'

const stockTransactionSchema = new mongoose.Schema({
    transactionId: {type: String, require: true, index: true, unique: true},
    batchId: {type: String, ref: 'ProductBatch', require: true},
    warehouseId: {type: String, ref: 'Warehouse', require: true},
    transactionType: {type: String, Enumerator: ['IMPORT', 'EXPORT', 'ADJUST'], require: true},
    quantity: {type: Number, require: true},
    transactionDate: {type: Date, require: true},
    relatedInvoiceId: {type: String}
}, {timestamps: true});

export const StockTransaction = mongoose.Model('StockTransaction', stockTransactionSchema)