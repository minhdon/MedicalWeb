import mongoose from "mongoose"

const adminSchema = new mongoose.Schema({
    adminName: {type: String, required: true},
    passWord: {type: String, required: true},
    address: {type: String},
    email: {type: String},
    phoneNum: {type: String},
    sex: {type: Boolean}
}, {timestamps: true});

export const Admin = mongoose.model('Admin', adminSchema)