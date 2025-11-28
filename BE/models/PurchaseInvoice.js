import mongoose from 'mongoose'

const purchaseInvoiceSchema = new mongoose.Schema({
    manufacturerId: {type: mongoose.Schema.Types.ObjectId, ref: 'Manufacturer', required: true},
    dateImport: {type: Date, required: true},
    totalBill: {type: Number, default: 0}
}, {timestamps: true});

export const PurchaseInvoice = mongoose.model('PurchaseInvoice', purchaseInvoiceSchema)