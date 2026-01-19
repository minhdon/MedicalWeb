/**
 * Optimized Unit Analysis Script with Progress Logging
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

// Pharmaceutical unit conversions
const STANDARD_CONVERSIONS = {
    'Viên': { baseUnit: 'Viên', ratio: 1 },
    'Vỉ': { baseUnit: 'Viên', ratio: 10, description: '1 Vỉ = 10 Viên' },
    'Hộp': { baseUnit: 'Viên', ratio: 50, description: '1 Hộp = 50 Viên' },
    'ml': { baseUnit: 'ml', ratio: 1 },
    'Chai': { baseUnit: 'ml', ratio: 100, description: '1 Chai = 100ml' },
    'Lọ': { baseUnit: 'ml', ratio: 30, description: '1 Lọ = 30ml' },
    'Gói': { baseUnit: 'Gói', ratio: 1 },
    'Túi': { baseUnit: 'Gói', ratio: 10 },
    'Viên nang': { baseUnit: 'Viên nang', ratio: 1 },
    'Tuýp': { baseUnit: 'g', ratio: 20 },
    'g': { baseUnit: 'g', ratio: 1 },
    'Ống': { baseUnit: 'Ống', ratio: 1 }
};

async function analyzeUnits() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected!\n');

        console.log('📊 Counting products...');
        const totalCount = await Product.countDocuments();
        console.log(`Found ${totalCount} total products\n`);

        console.log('📥 Fetching products (this may take a moment)...');
        const products = await Product.find({}).select('productName unit variants price').lean();
        console.log(`✅ Loaded ${products.length} products\n`);

        // Analysis
        console.log('🔍 Analyzing units...');
        const unitStats = new Map();
        let withVariants = 0;
        let withoutVariants = 0;

        products.forEach((product, index) => {
            if ((index + 1) % 100 === 0) {
                process.stdout.write(`\rProcessing: ${index + 1}/${products.length}`);
            }

            const unit = product.unit || 'N/A';

            if (!unitStats.has(unit)) {
                unitStats.set(unit, {
                    count: 0,
                    hasVariants: 0,
                    noVariants: 0,
                    examples: []
                });
            }

            const stats = unitStats.get(unit);
            stats.count++;

            if (stats.examples.length < 3) {
                stats.examples.push(product.productName);
            }

            if (product.variants && product.variants.length > 0) {
                stats.hasVariants++;
                withVariants++;
            } else {
                stats.noVariants++;
                withoutVariants++;
            }
        });

        console.log('\n\n' + '='.repeat(70));
        console.log('📋 UNIT STATISTICS');
        console.log('='.repeat(70));

        const sorted = Array.from(unitStats.entries()).sort((a, b) => b[1].count - a[1].count);

        sorted.forEach(([unit, stats]) => {
            console.log(`\n📦 ${unit}: ${stats.count} products`);
            console.log(`   With variants: ${stats.hasVariants} | Without: ${stats.noVariants}`);
            console.log(`   Examples: ${stats.examples.join(', ')}`);
        });

        console.log('\n' + '='.repeat(70));
        console.log('💡 CONVERSION RECOMMENDATIONS');
        console.log('='.repeat(70));

        sorted.forEach(([unit, stats]) => {
            if (stats.noVariants === 0) return;

            console.log(`\n${unit} (${stats.noVariants} need variants):`);

            if (STANDARD_CONVERSIONS[unit]) {
                const conv = STANDARD_CONVERSIONS[unit];
                console.log(`  ✅ ${conv.description || `Base: ${conv.baseUnit}, Ratio: ${conv.ratio}`}`);

                const related = Object.entries(STANDARD_CONVERSIONS)
                    .filter(([u, c]) => c.baseUnit === conv.baseUnit)
                    .sort((a, b) => a[1].ratio - b[1].ratio);

                console.log(`  Suggested variants:`);
                related.forEach(([u, c]) => {
                    console.log(`    { unit: "${u}", ratio: ${c.ratio}, price: [TBD] }`);
                });
            } else {
                console.log(`  ⚠️  Custom unit - define ratio manually`);
            }
        });

        console.log('\n' + '='.repeat(70));
        console.log('📊 SUMMARY');
        console.log('='.repeat(70));
        console.log(`Total: ${products.length} products`);
        console.log(`With variants: ${withVariants}`);
        console.log(`Without variants: ${withoutVariants}`);
        console.log(`Unique units: ${unitStats.size}`);
        console.log('\n✅ Analysis complete!');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

analyzeUnits();
