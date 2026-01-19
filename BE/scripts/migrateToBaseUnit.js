/**
 * Migration Script: Add baseUnit to existing ProductBatch documents
 * Run: node BE/scripts/migrateToBaseUnit.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { ProductBatch } from '../models/product/ProductBatch.js';
import { Product } from '../models/product/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGO_URI;

async function migrateToBaseUnit() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('📊 Starting baseUnit migration...\n');

        // Get all batches without baseUnit field
        const batches = await ProductBatch.find({
            $or: [
                { baseUnit: { $exists: false } },
                { baseUnit: null },
                { baseUnit: '' }
            ]
        });

        console.log(`Found ${batches.length} batches to migrate\n`);

        let migrated = 0;
        let errors = 0;

        for (const batch of batches) {
            try {
                // Get product to determine base unit
                const product = await Product.findById(batch.productId);

                if (!product) {
                    console.log(`⚠️  Skipping batch ${batch._id}: Product not found`);
                    errors++;
                    continue;
                }

                // Determine base unit
                let baseUnit = 'Đơn vị'; // Default

                if (product.variants && product.variants.length > 0) {
                    // Base unit = variant with ratio 1
                    const baseVariant = product.variants.find(v => v.ratio === 1);
                    if (baseVariant) {
                        baseUnit = baseVariant.unit;
                    } else {
                        baseUnit = product.variants[0].unit; // Fallback to first
                    }
                } else if (product.unit) {
                    baseUnit = product.unit;
                }

                // Update batch
                batch.baseUnit = baseUnit;
                await batch.save();

                migrated++;

                if (migrated % 10 === 0) {
                    console.log(`✅ Migrated ${migrated} batches...`);
                }

            } catch (error) {
                console.error(`❌ Error migrating batch ${batch._id}:`, error.message);
                errors++;
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log('📊 Migration Summary:');
        console.log(`Total batches: ${batches.length}`);
        console.log(`✅ Migrated: ${migrated}`);
        console.log(`❌ Errors: ${errors}`);
        console.log('='.repeat(50));

        if (errors > 0) {
            console.log('\n⚠️  Some batches failed to migrate. Review errors above.');
        } else {
            console.log('\n🎉 All batches migrated successfully!');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

migrateToBaseUnit();
