import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    userName: {type: String, required: true},
    passWord: {type: String, required: true},
    address: {type: String},
    email: {type: String},
    DoB: {type: Date},
    phoneNum: { type: String},
    sex: {type: Boolean}
}, {timestamps: true});

export const User = mongoose.model('User', userSchema)