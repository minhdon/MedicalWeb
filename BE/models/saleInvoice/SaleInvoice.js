import mongoose from 'mongoose'

const saleInvoiceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', default: null }, // null = Online/Unassigned
    saleDate: { type: Date, required: true, default: Date.now },
    statusId: { type: mongoose.Schema.Types.ObjectId, ref: 'OrderStatus', required: true },

    // New Fields for Order Management
    totalAmount: { type: Number, default: 0 },
    shippingAddress: { type: String },
    paymentMethod: { type: String, enum: ['COD', 'Banking'], default: 'COD' },
    note: { type: String }
}, { timestamps: true });

export const SaleInvoice = mongoose.model('SaleInvoice', saleInvoiceSchema)