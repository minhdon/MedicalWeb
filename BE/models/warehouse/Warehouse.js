import mongoose from 'mongoose'

const warehouseSchema = new mongoose.Schema({
    warehouseName: { type: String, required: true },
    address: { type: String },
    phone: { type: String },
    manager: { type: String },
    warehouseType: { type: String, enum: ['central', 'branch'], default: 'branch' }, // Central vs Branch
    status: { type: Boolean, default: true }
}, { timestamps: true });

// Prevent Delete if Stock exists
warehouseSchema.pre('findOneAndDelete', async function (next) {
    try {
        const doc = await this.model.findOne(this.getQuery());
        if (doc) {
            const ProductBatch = mongoose.model('ProductBatch');
            const hasStock = await ProductBatch.findOne({
                warehouseId: doc._id,
                remainingQuantity: { $gt: 0 }
            });
            if (hasStock) {
                return next(new Error('Không thể xóa kho đang còn hàng tồn!'));
            }

            // Check Orders
            const SaleInvoice = mongoose.model('SaleInvoice');
            const hasOrders = await SaleInvoice.findOne({ warehouseId: doc._id });
            if (hasOrders) {
                return next(new Error('Không thể xóa kho đang có đơn hàng!'));
            }
        }
        next();
    } catch (e) {
        next(e);
    }
});

export const Warehouse = mongoose.model('Warehouse', warehouseSchema)