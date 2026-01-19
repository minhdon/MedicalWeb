import mongoose from 'mongoose'

const productBatchSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    purchaseInvoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseInvoice' },  // Optional - from purchase
    transferId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryTransfer' },  // Optional - from transfer
    warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },

    // Dates
    manufactureDate: { type: Date, required: true },
    expiryDate: {
        type: Date,
        required: true,
        validate: {
            validator: function (v) {
                return v > this.manufactureDate;
            },
            message: 'Ngày hết hạn phải sau ngày sản xuất'
        }
    },

    // Quantities (stored in BASE UNIT)
    quantity: { type: Number, required: true, min: 0 },
    remainingQuantity: {
        type: Number,
        required: true,
        validate: {
            validator: function (v) {
                return v <= this.quantity && v >= 0;
            },
            message: 'Số lượng còn lại không hợp lệ'
        }
    },
    baseUnit: {
        type: String,
        required: true,
        default: 'Đơn vị'  // Default for backward compatibility
    },

    dosage: { type: String, required: true },
    administration: { type: String, required: true }
}, { timestamps: true });

export const ProductBatch = mongoose.model('ProductBatch', productBatchSchema)