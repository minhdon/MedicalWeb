import mongoose from 'mongoose'

const manufacturerSchema = new mongoose.Schema({
    manufacturerId: {type: String, require: true, index: true, unique: true},
    manufacturerName: {type: String, require: true},
    adress: {type: String, require: true},
    phoneNum: {type: String, require: true}
}, {timestamps: true});

export const Manufacturer = mongoose.Model('Manufacturer', manufacturerSchema)