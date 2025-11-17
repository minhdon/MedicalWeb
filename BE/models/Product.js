import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
    productId: { type: String, require: true, index: true, unique: true },
    productName: { type: String, require: true },
    manufacturerId: { type: String, ref: 'Manufacturer', require: true },
    typeId: { type: String, ref: 'Category', require: true },
    img: { type: Image, require: true },
    productDesc: { type: String, require: true },
    packagingType: { type: String, Enumerator: ['Blister', 'Box', 'Bottle', 'Tube', 'Sachet', 'Ampoule', 'Vial', 'Bag'], require: true },
    status: { type: Boolean }
}, { timestamps: true });

export const Product = mongoose.Model('Product', productSchema)