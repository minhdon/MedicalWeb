import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    userId: {type: mongooses.Schema.Types.ObjectId, unique: true, index: true, require: true},
    userName: {type: String, require: true},
    passWord: {type: String, require: true},
    address: {type: String},
    email: {type: String},
    DoB: {type: Date},
    phoneNum: { type: String},
    sex: {type: Boolean}
}, {timestamps: true});

export const User = mongoose.Model('User', userSchema)