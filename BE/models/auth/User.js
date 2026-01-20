import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
    warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', default: null }, // Link Staff to Store
    fullName: { type: String }, // Thêm trường tên đầy đủ
    userName: { type: String, required: true },
    passWord: { type: String, required: true },
    address: { type: String },
    email: { type: String },
    DoB: { type: Date },
    phoneNum: { type: String },
    sex: { type: Boolean },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema)