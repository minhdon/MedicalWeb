import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from '../models/product/Product.js';
import { ProductBatch } from '../models/product/ProductBatch.js';
import { PurchaseInvoice } from '../models/purchaseInvoice/PurchaseInvoice.js';
import { Manufacturer } from '../models/manufacturer/Manufacturer.js';

dotenv.config(); // Config in current directory

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://lequanglong345_db_user:1n6RlPBkotLtiv2G@cluster0.3niejyk.mongodb.net/medical-website?retryWrites=true&w=majority&appName=Cluster0';

async function seedBatches() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const products = await Product.find();
        console.log(`Found ${products.length} products.`);

        let createdCount = 0;

        for (const product of products) {
            // Check if batch exists
            const existingBatch = await ProductBatch.findOne({ productId: product._id });
            if (!existingBatch) {
                // Determine Manufacturer and Invoice
                let invoiceId;
                const manufacturer = await Manufacturer.findById(product.manufacturerId);

                if (manufacturer) {
                    // Find or create invoice
                    let invoice = await PurchaseInvoice.findOne({ manufacturerId: manufacturer._id });
                    if (!invoice) {
                        invoice = await PurchaseInvoice.create({
                            manufacturerId: manufacturer._id,
                            dateImport: new Date(),
                            totalBill: 0
                        });
                    }
                    invoiceId = invoice._id;
                } else {
                    // Fallback if no manufacturer (shouldn't happen often)
                    console.log(`Skipping product ${product.productName} (No Manufacturer)`);
                    continue;
                }

                // Random Expiry 6 months to 2 years from now
                const now = new Date();
                const randomMonths = Math.floor(Math.random() * 24) + 6;
                const expiryDate = new Date(now.setMonth(now.getMonth() + randomMonths));

                // Random Stock
                const quantity = Math.floor(Math.random() * 200) + 10;

                await ProductBatch.create({
                    productId: product._id,
                    purchaseInvoiceId: invoiceId,
                    manufactureDate: new Date('2024-01-01'),
                    expiryDate: expiryDate,
                    quantity: quantity,
                    remainingQuantity: quantity,
                    dosage: 'Viên',
                    administration: 'Uống'
                });
                createdCount++;
            }
        }

        console.log(`Successfully created batches for ${createdCount} products that were missing them.`);
        process.exit(0);
    } catch (error) {
        console.error('Error seeding batches:', error);
        process.exit(1);
    }
}

seedBatches();
