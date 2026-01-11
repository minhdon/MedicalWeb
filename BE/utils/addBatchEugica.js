import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from '../models/product/Product.js';
import { ProductBatch } from '../models/product/ProductBatch.js';
import { PurchaseInvoice } from '../models/purchaseInvoice/PurchaseInvoice.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://lequanglong345_db_user:1n6RlPBkotLtiv2G@cluster0.3niejyk.mongodb.net/medical-website?retryWrites=true&w=majority&appName=Cluster0';

async function addBatch() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Find the product
        const productNameRegex = /Thuốc Eugica MEGA We care/i;
        const product = await Product.findOne({ productName: productNameRegex });

        if (!product) {
            console.error('Product not found!');
            process.exit(1);
        }

        console.log(`Found Product: ${product.productName} (${product._id})`);

        // Find an invoice (just take the first one or create dummy)
        let invoice = await PurchaseInvoice.findOne();
        if (!invoice) {
            invoice = await PurchaseInvoice.create({
                manufacturerId: product.manufacturerId, // Assuming it exists
                dateImport: new Date(),
                totalBill: 0
            });
        }

        // Create a NEW batch with DIFFERENT expiry date
        // Existing one likely 2026. Let's make this one expire sooner: late 2025?
        // Or much later: 2027.
        // Let's do 2025-06-01 (Sắp hết hạn check) or 2027-01-01.
        // Let's do 2025-12-01.

        await ProductBatch.create({
            productId: product._id,
            purchaseInvoiceId: invoice._id,
            manufactureDate: new Date('2024-01-01'),
            expiryDate: new Date('2025-06-15'), // Different date (Near expiry for testing badge?) or just different.
            quantity: 50,
            remainingQuantity: 50,
            dosage: 'Viên',
            administration: 'Uống'
        });

        console.log('Successfully added a new batch for Eugica with Expiry Date: 2025-06-15');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

addBatch();
