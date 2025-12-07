import mongoose from 'mongoose'

const warehouseSchema = new mongoose.Schema({
    warehouseName: {type: String, required: true},
    address: {type: String},
    status: {type: Boolean, default: true}
}, {timestamps: true});

export const Warehouse = mongoose.model('Warehouse', warehouseSchema)