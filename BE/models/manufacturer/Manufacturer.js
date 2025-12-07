import mongoose from 'mongoose'

const manufacturerSchema = new mongoose.Schema({
    manufacturerName: {type: String, required: true},
    address: {type: String},
    phoneNum: {type: String}
}, {timestamps: true});

export const Manufacturer = mongoose.model('Manufacturer', manufacturerSchema)