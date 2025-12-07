import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
    productName: { type: String, required: true },
    manufacturerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manufacturer', required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    img: { type: String },
    productDesc: { type: String },
    packagingType: { type: String, enum: ['Blister', 'Box', 'Bottle', 'Tube', 'Sachet', 'Ampoule', 'Vial', 'Bag'] },
    status: { type: Boolean, default: true }
}, { timestamps: true });

export const Product = mongoose.model('Product', productSchema)