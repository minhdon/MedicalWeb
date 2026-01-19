import mongoose from 'mongoose'

const saleInvoiceDetailSchema = new mongoose.Schema({
    saleInvoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'SaleInvoice', required: true },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductBatch', required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 }, // Prevent 0 or negative
    unitPrice: { type: Number, required: true, min: 0 }, // Prevent negative price
    totalPrice: { type: Number, required: true, min: 0 }
}, { timestamps: true });

// Safety Net: Prevent selling expired items
saleInvoiceDetailSchema.pre('save', async function (next) {
    if (this.isNew || this.isModified('batchId')) {
        try {
            const ProductBatch = mongoose.model('ProductBatch');

            // Get session from document if available (for transaction support)
            const session = this.$session();

            const batch = await ProductBatch.findById(this.batchId).session(session);

            if (batch) {
                // 1. Expiry Check
                if (batch.expiryDate < new Date()) {
                    return next(new Error('Không thể bán lô hàng đã hết hạn sử dụng!'));
                }
            }
        } catch (error) {
            return next(error);
        }
    }
    next();
});

saleInvoiceDetailSchema.index(
    { saleInvoiceId: 1, batchId: 1, productId: 1 },
    { unique: true }
)

export const SaleInvoiceDetail = mongoose.model('SaleInvoiceDetail', saleInvoiceDetailSchema)