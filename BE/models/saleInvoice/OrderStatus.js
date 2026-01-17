import mongoose from 'mongoose'

const orderStatusSchema = new mongoose.Schema({
    statusName: { type: String, enum: ['Pending', 'Confirmed', 'Processing', 'Completed', 'Cancelled'], required: true, unique: true }
});

export const OrderStatus = mongoose.model('OrderStatus', orderStatusSchema)