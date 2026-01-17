import mongoose from 'mongoose'

const saleInvoiceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', default: null }, // null = Online/Unassigned
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // Staff who processed in-store sale
    isInStoreSale: { type: Boolean, default: false }, // Flag for in-store vs online order
    saleDate: { type: Date, required: true, default: Date.now },
    statusId: { type: mongoose.Schema.Types.ObjectId, ref: 'OrderStatus', required: true },

    // New Fields for Order Management
    totalAmount: { type: Number, default: 0 },
    shippingAddress: { type: String },
    paymentMethod: { type: String, enum: ['COD', 'Banking', 'Tiền mặt'], default: 'COD' },
    note: { type: String }
}, { timestamps: true });

export const SaleInvoice = mongoose.model('SaleInvoice', saleInvoiceSchema)