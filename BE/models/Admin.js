import mongoose from "mongoose"

const adminSchema = new mongoose.Schema({
    adminId: {type: mongoose.Schema.Types.ObjectId, require: true, index: true, unique: true},
    adminName: {type: String, require: true},
    passWord: {type: String, require: true},
    address: {type: String},
    email: {type: String},
    phoneNum: {type: String},
    sex: {type: Boolean}
}, {timestamps: true});

export const Admin = mongoose.Model('Admin', adminSchema)