/**
 * Migration Script: Populate variant ratios from product name patterns
 * Parses patterns like "(10 vỉ x 10 viên)" to calculate correct ratios
 * 
 * Run: node BE/scripts/migrateRatios.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Product } from '../models/product/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGO_URI;

// Parse packaging pattern from product name
function parsePackaging(productName) {
    // Pattern: (X unit1 x Y unit2) - Example: (10 vỉ x 10 viên)
    const doubleMatch = productName.match(/\((\d+)\s*([^\d\sx]+)\s*x\s*(\d+)\s*([^\d\s)]+)\)/i);
    if (doubleMatch) {
        return {
            type: 'double',
            outer: { qty: parseInt(doubleMatch[1]), unit: doubleMatch[2].trim().toLowerCase() },
            inner: { qty: parseInt(doubleMatch[3]), unit: doubleMatch[4].trim().toLowerCase() },
            total: parseInt(doubleMatch[1]) * parseInt(doubleMatch[3])
        };
    }

    // Pattern: (Xml) or (X viên) - Example: (60ml)
    const singleMatch = productName.match(/\((\d+)\s*([^\d\s)]+)\)/i);
    if (singleMatch) {
        return {
            type: 'single',
            qty: parseInt(singleMatch[1]),
            unit: singleMatch[2].trim().toLowerCase()
        };
    }

    return null;
}

// Calculate ratios based on packaging
function calculateRatios(variants, packaging, productUnit) {
    if (!variants || variants.length === 0) return variants;

    const updatedVariants = variants.map(v => ({
        ...v.toObject ? v.toObject() : v,
        ratio: v.ratio || 1
    }));

    if (!packaging) {
        // No packaging info - assume single unit system
        let ratio = 1;
        for (let i = 0; i < updatedVariants.length; i++) {
            updatedVariants[i].ratio = ratio;
            ratio *= 10; // Default multiplier
        }
        return updatedVariants;
    }

    if (packaging.type === 'double') {
        // Example: (10 vỉ x 10 viên) with Hộp
        // viên = 1, vỉ = 10, Hộp = 100
        for (const variant of updatedVariants) {
            const unitLower = variant.unit.toLowerCase();

            if (unitLower === packaging.inner.unit) {
                variant.ratio = 1; // Base unit
            } else if (unitLower === packaging.outer.unit) {
                variant.ratio = packaging.inner.qty;
            } else if (unitLower === productUnit.toLowerCase() ||
                unitLower === 'hộp' || unitLower === 'chai') {
                variant.ratio = packaging.total;
            }
        }
    } else if (packaging.type === 'single') {
        // Example: (60ml) with Chai
        // ml = 1, Chai = 60
        for (const variant of updatedVariants) {
            const unitLower = variant.unit.toLowerCase();

            if (unitLower === packaging.unit) {
                variant.ratio = 1; // Base unit
            } else {
                variant.ratio = packaging.qty;
            }
        }
    }

    return updatedVariants;
}

async function migrateRatios() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected!\n');

        console.log('📊 Counting products...');
        const totalCount = await Product.countDocuments({ 'variants.0': { $exists: true } });
        console.log(`Found ${totalCount} products with variants\n`);

        console.log('📥 Processing products...');
        const cursor = Product.find({ 'variants.0': { $exists: true } }).cursor();

        let processed = 0;
        let updated = 0;
        let errors = 0;

        for await (const product of cursor) {
            try {
                const packaging = parsePackaging(product.productName);
                const updatedVariants = calculateRatios(
                    product.variants,
                    packaging,
                    product.unit || 'Hộp'
                );

                // Check if any ratio was updated
                const needsUpdate = updatedVariants.some((v, i) =>
                    v.ratio !== (product.variants[i]?.ratio || 1)
                );

                if (needsUpdate || product.variants.some(v => !v.ratio)) {
                    product.variants = updatedVariants;
                    await product.save();
                    updated++;
                }

                processed++;
                if (processed % 100 === 0) {
                    process.stdout.write(`\rProcessed: ${processed}/${totalCount} | Updated: ${updated}`);
                }

            } catch (err) {
                errors++;
                console.error(`\nError processing ${product.productName}:`, err.message);
            }
        }

        console.log('\n\n' + '='.repeat(60));
        console.log('📊 MIGRATION SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total processed: ${processed}`);
        console.log(`✅ Updated: ${updated}`);
        console.log(`❌ Errors: ${errors}`);
        console.log('='.repeat(60));

        // Show samples
        console.log('\n📝 SAMPLE RESULTS (first 5 with ratios):');
        const samples = await Product.find({ 'variants.0': { $exists: true } })
            .select('productName unit variants')
            .limit(5)
            .lean();

        samples.forEach(p => {
            console.log(`\n${p.productName.substring(0, 70)}...`);
            console.log(`  Unit: ${p.unit}`);
            p.variants.forEach(v => {
                console.log(`  - ${v.unit}: ratio ${v.ratio}, price ${v.price}`);
            });
        });

        console.log('\n✅ Migration complete!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

migrateRatios();
