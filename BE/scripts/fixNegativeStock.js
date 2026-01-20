/**
 * Find batches where remainingQuantity > quantity (invalid state)
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { ProductBatch } from '../models/product/ProductBatch.js';

const MONGO_URI = process.env.MONGO_URI;

async function findInvalidBatches() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Use aggregation to find where remainingQuantity > quantity
        const invalidBatches = await ProductBatch.aggregate([
            {
                $match: {
                    $expr: { $gt: ["$remainingQuantity", "$quantity"] }
                }
            }
        ]);

        if (invalidBatches.length === 0) {
            console.log('✅ No batches with remainingQuantity > quantity found!');
        } else {
            console.log(`❌ Found ${invalidBatches.length} invalid batches:`);
            for (const b of invalidBatches) {
                console.log(`  - Batch ID: ${b._id}`);
                console.log(`    Product: ${b.productId}`);
                console.log(`    Quantity: ${b.quantity}, Remaining: ${b.remainingQuantity}`);
                console.log(`    Excess: ${b.remainingQuantity - b.quantity}`);
                console.log('');
            }

            // Fix them by setting remainingQuantity = quantity
            console.log('Fixing invalid batches...');
            for (const b of invalidBatches) {
                await ProductBatch.updateOne(
                    { _id: b._id },
                    { $set: { remainingQuantity: b.quantity } }
                );
                console.log(`  Fixed batch ${b._id}`);
            }
            console.log('✅ All invalid batches fixed!');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

findInvalidBatches();
