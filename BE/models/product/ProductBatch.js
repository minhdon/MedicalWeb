import mongoose from 'mongoose'

const productBatchSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    purchaseInvoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseInvoice', required: true },
    warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true }, // New core field
    manufactureDate: { type: Date, required: true },
    expiryDate: {
        type: Date,
        required: true,
        validate: {
            validator: function (v) {
                return v > this.manufactureDate;
            },
            message: 'Ngày hết hạn phải sau ngày sản xuất' // Validation Added
        }
    },
    quantity: { type: Number, required: true, min: 0 },
    remainingQuantity: {
        type: Number,
        required: true,
        validate: {
            validator: function (v) {
                return v <= this.quantity && v >= 0;
            },
            message: 'Số lượng còn lại không hợp lệ' // Validation Added
        }
    },
    dosage: { type: String, required: true },
    administration: { type: String, required: true }
}, { timestamps: true });

// Cascade Delete: Delete batch if Product is deleted (Handled in Product model pre-remove)

export const ProductBatch = mongoose.model('ProductBatch', productBatchSchema)