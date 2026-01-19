/**
 * Sync Stock Script
 * Updates stockQuantity and nearestExpiryDate for all products based on batches
 * Run this script periodically or after batch changes
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from '../models/product/Product.js';
import { ProductBatch } from '../models/product/ProductBatch.js';
import { Warehouse } from '../models/warehouse/Warehouse.js';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/medical-website';

async function syncProductStock() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find central warehouse
        const centralWarehouse = await Warehouse.findOne({ warehouseType: 'central' });
        const centralWarehouseId = centralWarehouse?._id;

        if (!centralWarehouse) {
            console.log('⚠️ No central warehouse found. Will calculate total stock from all warehouses.');
        } else {
            console.log(`📦 Using central warehouse: ${centralWarehouse.warehouseName}`);
        }

        // Get all products
        const products = await Product.find({});
        console.log(`Found ${products.length} products to sync`);

        let updated = 0;
        let errors = 0;

        for (const product of products) {
            try {
                // Build batch query
                const batchQuery = { productId: product._id };
                if (centralWarehouseId) {
                    batchQuery.warehouseId = centralWarehouseId;
                }

                // Get batches for this product
                const batches = await ProductBatch.find(batchQuery);

                // Calculate total stock
                const stockQuantity = batches.reduce((sum, b) => sum + (b.remainingQuantity || 0), 0);

                // Find nearest expiry date
                const validBatches = batches.filter(b => b.expiryDate && b.remainingQuantity > 0);
                const sortedByExpiry = validBatches.sort((a, b) =>
                    new Date(a.expiryDate) - new Date(b.expiryDate)
                );
                const nearestExpiryDate = sortedByExpiry.length > 0 ? sortedByExpiry[0].expiryDate : null;

                // Update product
                await Product.updateOne(
                    { _id: product._id },
                    {
                        $set: {
                            stockQuantity,
                            nearestExpiryDate
                        }
                    }
                );

                updated++;

                // Progress indicator
                if (updated % 50 === 0) {
                    console.log(`  Synced ${updated}/${products.length}...`);
                }
            } catch (err) {
                console.error(`Error updating ${product.productName}:`, err.message);
                errors++;
            }
        }

        console.log('\n✅ Sync completed!');
        console.log(`   Updated: ${updated} products`);
        console.log(`   Errors: ${errors}`);

    } catch (error) {
        console.error('Sync failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the sync
syncProductStock();
