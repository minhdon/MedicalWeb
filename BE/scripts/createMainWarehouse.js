/**
 * Create "Kho Tổng" (Main Warehouse) and migrate existing batches to it
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

async function createMainWarehouse() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('📦 Creating Main Warehouse\n');

        // Check if main warehouse exists
        let mainWarehouse = await Warehouse.findOne({
            $or: [
                { warehouseName: 'Kho Tổng' },
                { isMainWarehouse: true }
            ]
        });

        if (!mainWarehouse) {
            // Create main warehouse
            mainWarehouse = await Warehouse.create({
                warehouseName: 'Kho Tổng',
                address: 'Địa chỉ kho tổng',
                status: true,
                isMainWarehouse: true
            });
            console.log('✅ Created "Kho Tổng" warehouse:', mainWarehouse._id);
        } else {
            console.log('ℹ️  Main warehouse already exists:', mainWarehouse.warehouseName);
        }

        // Find batches without warehouseId and assign to main warehouse
        const orphanBatches = await ProductBatch.countDocuments({
            warehouseId: { $exists: false }
        });

        if (orphanBatches > 0) {
            await ProductBatch.updateMany(
                { warehouseId: { $exists: false } },
                { $set: { warehouseId: mainWarehouse._id } }
            );
            console.log(`✅ Assigned ${orphanBatches} orphan batches to Kho Tổng`);
        }

        // Stats
        const totalBatches = await ProductBatch.countDocuments({ warehouseId: mainWarehouse._id });
        const totalQty = await ProductBatch.aggregate([
            { $match: { warehouseId: mainWarehouse._id } },
            { $group: { _id: null, total: { $sum: '$remainingQuantity' } } }
        ]);

        console.log(`\n📊 Kho Tổng Stats:`);
        console.log(`   Total Batches: ${totalBatches}`);
        console.log(`   Total Quantity: ${totalQty[0]?.total || 0}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

createMainWarehouse();
