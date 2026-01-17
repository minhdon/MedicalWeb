import mongoose from 'mongoose'

const purchaseInvoiceSchema = new mongoose.Schema({
    manufacturerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manufacturer', required: true },
    warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true }, // Track input warehouse
    dateImport: { type: Date, required: true },
    totalBill: { type: Number, default: 0 }
}, { timestamps: true });

// Prevent Delete if Batches sold, otherwise Cascade Delete
purchaseInvoiceSchema.pre('findOneAndDelete', async function (next) {
    try {
        const doc = await this.model.findOne(this.getQuery());
        if (doc) {
            const ProductBatch = mongoose.model('ProductBatch');
            const PurchaseInvoiceDetail = mongoose.model('PurchaseInvoiceDetail');

            // 1. Check if ANY batch from this invoice has been sold
            const usedBatch = await ProductBatch.findOne({
                purchaseInvoiceId: doc._id,
                $expr: { $lt: ["$remainingQuantity", "$quantity"] }
            });

            if (usedBatch) {
                return next(new Error('Không thể xóa phiếu nhập đã có hàng bán ra!'));
            }

            // 2. Safe to delete: Cascade delete Batches and Details
            await ProductBatch.deleteMany({ purchaseInvoiceId: doc._id });
            await PurchaseInvoiceDetail.deleteMany({ purchaseInvoiceId: doc._id });
        }
        next();
    } catch (e) {
        next(e);
    }
});

export const PurchaseInvoice = mongoose.model('PurchaseInvoice', purchaseInvoiceSchema)