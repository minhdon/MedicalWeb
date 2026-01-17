import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema({
    categoryName: { type: String, required: true }
}, { timestamps: true });

// Prevent Delete if Products exist
categorySchema.pre('findOneAndDelete', async function (next) {
    try {
        const doc = await this.model.findOne(this.getQuery());
        if (doc) {
            const Product = mongoose.model('Product');
            const count = await Product.countDocuments({ categoryId: doc._id });
            if (count > 0) {
                return next(new Error('Không thể xóa Danh mục đang có sản phẩm!'));
            }
        }
        next();
    } catch (e) {
        next(e);
    }
});

export const Category = mongoose.model('Category', categorySchema)