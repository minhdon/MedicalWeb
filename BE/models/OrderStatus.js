import mongoose from 'mongoose'

const orderStatusSchema = new mongoose.Schema({
    statusId: {type: String, require: true, index: true, unique: true},
    statusName: {type: String, Enumerator: ['Pending', 'Processing', 'Completed', 'Cancelled'], require: true}
});

export const OrderStatus = mongoose.Model('OrderStatus', orderStatusSchema)