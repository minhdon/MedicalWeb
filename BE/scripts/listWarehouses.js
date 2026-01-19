/**
 * List all warehouses and their stock summary
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Warehouse } from '../models/warehouse/Warehouse.js';
import { ProductBatch } from '../models/product/ProductBatch.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function listWarehouses() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('📦 Warehouse Stock Summary\n');

        const warehouses = await Warehouse.find({});
        console.log(`Found ${warehouses.length} warehouses:\n`);

        for (const wh of warehouses) {
            console.log('='.repeat(60));
            console.log(`📍 ${wh.warehouseName}`);
            console.log(`   ID: ${wh._id}`);
            console.log(`   Address: ${wh.address || 'N/A'}`);

            // Get batch count and total quantity
            const stats = await ProductBatch.aggregate([
                { $match: { warehouseId: wh._id } },
                {
                    $group: {
                        _id: null,
                        totalBatches: { $sum: 1 },
                        totalQuantity: { $sum: '$remainingQuantity' },
                        products: { $addToSet: '$productId' }
                    }
                }
            ]);

            if (stats.length > 0) {
                console.log(`   📊 Batches: ${stats[0].totalBatches}`);
                console.log(`   📊 Total Quantity: ${stats[0].totalQuantity}`);
                console.log(`   📊 Unique Products: ${stats[0].products.length}`);
            } else {
                console.log(`   📊 No stock`);
            }
        }

        console.log('\n' + '='.repeat(60));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

listWarehouses();
