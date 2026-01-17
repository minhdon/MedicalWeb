import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
    productName: { type: String, required: true },
    manufacturerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manufacturer', required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    img: { type: String },
    productDesc: { type: String },
    // Các trường chi tiết từ CSV
    ingredients: { type: String }, // Thành phần
    usage: { type: String },       // Cách dùng / Công dụng
    preservation: { type: String }, // Bảo quản
    sideEffects: { type: String }, // Tác dụng phụ
    precautions: { type: String }, // Lưu ý
    origin: { type: String },      // Xuất xứ
    brand: { type: String },       // Thương hiệu

    price: { type: Number, required: true }, // Giá bán (Mặc định)
    unit: { type: String }, // Đơn vị tính giá (VD: Hộp, Viên, Vỉ)

    // Mảng chứa các đơn vị tính khác nhau (Hộp, Vỉ, Viên)
    variants: [{
        unit: { type: String },
        price: { type: Number }
    }],

    status: { type: Boolean, default: true }
}, { timestamps: true });

// Cascade Delete Batches when Product is deleted
productSchema.pre('findOneAndDelete', async function (next) {
    try {
        const doc = await this.model.findOne(this.getQuery());
        if (doc) {
            await mongoose.model('ProductBatch').deleteMany({ productId: doc._id });
        }
        next();
    } catch (e) {
        next(e);
    }
});

export const Product = mongoose.model('Product', productSchema)