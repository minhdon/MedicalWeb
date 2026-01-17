import mongoose from 'mongoose'

const manufacturerSchema = new mongoose.Schema({
    manufacturerName: { type: String, required: true },
    address: { type: String },
    phoneNum: { type: String }
}, { timestamps: true });

// Prevent Delete if Products exist
manufacturerSchema.pre('findOneAndDelete', async function (next) {
    try {
        const doc = await this.model.findOne(this.getQuery());
        if (doc) {
            const Product = mongoose.model('Product');
            const count = await Product.countDocuments({ manufacturerId: doc._id });
            if (count > 0) {
                return next(new Error('Không thể xóa Nhà cung cấp đang có sản phẩm!'));
            }
        }
        next();
    } catch (e) {
        next(e);
    }
});

export const Manufacturer = mongoose.model('Manufacturer', manufacturerSchema)