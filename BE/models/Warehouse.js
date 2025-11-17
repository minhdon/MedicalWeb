import mongoose from 'mongoose'

const warehouseSchema = new mongoose.Schema({
    warehouseId: {type: String, require: true, index: true, unique: true},
    warehouseName: {type: String},
    status: {type: Boolean}
}, {timestamps: true});

export const Warehouse = mongoose.Model('Warehouse', warehouseSchema)