import mongoose from 'mongoose'

const purchaseInvoiceSchema = new mongoose.Schema({
    purchaseInvoiceId: {type: String, require: true, index: true, unique: true},
    manufacturerId: {type: String, ref: 'Manufacturer', require: true},
    dateImport: {type: Date, require: true},
    totalBill: {type: Number}
}, {timestamps: true});

export const PurchaseInvoice = mongoose.Model('PurchaseInvoice', purchaseInvoiceSchema)