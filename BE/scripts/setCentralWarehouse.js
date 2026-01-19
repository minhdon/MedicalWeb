/**
 * Set TEST_Warehouse_A as the Central Warehouse
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Warehouse } from '../models/warehouse/Warehouse.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function setCentralWarehouse() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('🏭 Setting Central Warehouse\n');

        // Find TEST_Warehouse_A
        const warehouse = await Warehouse.findOne({ warehouseName: 'TEST_Warehouse_A' });

        if (warehouse) {
            warehouse.warehouseType = 'central';
            warehouse.warehouseName = 'Kho Tổng';  // Rename
            await warehouse.save();
            console.log('✅ Set "TEST_Warehouse_A" as Central Warehouse (Kho Tổng)');
            console.log(`   ID: ${warehouse._id}`);
        } else {
            console.log('❌ TEST_Warehouse_A not found');
        }

        // Set all others to branch
        const result = await Warehouse.updateMany(
            { _id: { $ne: warehouse?._id } },
            { $set: { warehouseType: 'branch' } }
        );
        console.log(`✅ Set ${result.modifiedCount} other warehouses as branches`);

        // List all warehouses
        console.log('\n📦 All Warehouses:');
        const all = await Warehouse.find({});
        all.forEach(w => {
            console.log(`   ${w.warehouseType === 'central' ? '🏭' : '🏪'} ${w.warehouseName} (${w.warehouseType})`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

setCentralWarehouse();
