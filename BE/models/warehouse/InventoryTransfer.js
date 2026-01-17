import mongoose from 'mongoose'

const inventoryTransferSchema = new mongoose.Schema({
    fromWarehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    toWarehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    productBatchId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductBatch', required: true },
    quantity: { type: Number, required: true, min: 1 },
    transferDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['Pending', 'Completed', 'Cancelled'], default: 'Pending' },
    note: { type: String }
}, { timestamps: true });

// Validation: Cannot transfer to same warehouse
inventoryTransferSchema.pre('save', function (next) {
    if (this.fromWarehouseId.equals(this.toWarehouseId)) {
        return next(new Error('Kho nguồn và kho đích không được trùng nhau'));
    }
    next();
});

export const InventoryTransfer = mongoose.model('InventoryTransfer', inventoryTransferSchema)
