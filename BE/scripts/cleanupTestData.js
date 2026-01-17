// Cleanup Test Data Script
// Removes all test data created during database testing
// Run: node scripts/cleanupTestData.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from '../models/product/Product.js';
import { ProductBatch } from '../models/product/ProductBatch.js';
import { Category } from '../models/product/Category.js';
import { Manufacturer } from '../models/manufacturer/Manufacturer.js';
import { Warehouse } from '../models/warehouse/Warehouse.js';
import { PurchaseInvoice } from '../models/purchaseInvoice/PurchaseInvoice.js';
import { SaleInvoice } from '../models/saleInvoice/SaleInvoice.js';
import { SaleInvoiceDetail } from '../models/saleInvoice/SaleInvoiceDetail.js';
import { InventoryTransfer } from '../models/warehouse/InventoryTransfer.js';
import { User } from '../models/auth/User.js';

dotenv.config();

// Test data patterns to match
const TEST_PATTERNS = [
    /^TEST/i,
    /^HEAVY/i,
    /^BIZ_/i,
    /^EXT_/i,
    /^TEMP/i,
    /^MOCK/i
];

const matchesTestPattern = (name) => {
    if (!name) return false;
    return TEST_PATTERNS.some(pattern => pattern.test(name));
};

const cleanup = async () => {
    console.log("🧹 Starting Test Data Cleanup...\n");

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to database\n");

        // 1. Find and delete test Products
        const testProducts = await Product.find({
            productName: { $regex: /^(TEST|HEAVY|BIZ_|EXT_|TEMP|MOCK)/i }
        });
        const productIds = testProducts.map(p => p._id);
        console.log(`📦 Found ${testProducts.length} test products`);

        // 2. Delete batches for these products
        const batchesDeleted = await ProductBatch.deleteMany({
            $or: [
                { productId: { $in: productIds } },
                { administration: 'HEAVY_TEST' },
                { administration: { $regex: /^(TEST|BIZ_)/i } }
            ]
        });
        console.log(`   └─ Deleted ${batchesDeleted.deletedCount} batches`);

        // 3. Delete the products
        const productsDeleted = await Product.deleteMany({
            _id: { $in: productIds }
        });
        console.log(`   └─ Deleted ${productsDeleted.deletedCount} products`);

        // 4. Delete test Categories
        const catsDeleted = await Category.deleteMany({
            categoryName: { $regex: /^(TEST|HEAVY|BIZ_|EXT_|TEMP)/i }
        });
        console.log(`📁 Deleted ${catsDeleted.deletedCount} test categories`);

        // 5. Delete test Manufacturers
        const manusDeleted = await Manufacturer.deleteMany({
            manufacturerName: { $regex: /^(TEST|HEAVY|BIZ_|EXT_|TEMP)/i }
        });
        console.log(`🏭 Deleted ${manusDeleted.deletedCount} test manufacturers`);

        // 6. Delete test Warehouses
        const whDeleted = await Warehouse.deleteMany({
            warehouseName: { $regex: /^(TEST|HEAVY|BIZ_|EXT_|TEMP)/i }
        });
        console.log(`🏠 Deleted ${whDeleted.deletedCount} test warehouses`);

        // 7. Delete test InventoryTransfers
        const transfersDeleted = await InventoryTransfer.deleteMany({
            note: 'BIZ_TEST'
        });
        console.log(`🔄 Deleted ${transfersDeleted.deletedCount} test transfers`);

        // 8. Delete test SaleInvoices (with note 'BIZ_TEST' or similar)
        const testOrders = await SaleInvoice.find({ note: 'BIZ_TEST' });
        const orderIds = testOrders.map(o => o._id);
        if (orderIds.length > 0) {
            await SaleInvoiceDetail.deleteMany({ saleInvoiceId: { $in: orderIds } });
            await SaleInvoice.deleteMany({ _id: { $in: orderIds } });
            console.log(`🛒 Deleted ${orderIds.length} test orders and their details`);
        }

        // 9. Delete test Users (heavy_user_*, dup_user_*, base_dup)
        const usersDeleted = await User.deleteMany({
            userName: { $regex: /^(heavy_|dup_user_|base_dup)/i }
        });
        console.log(`👤 Deleted ${usersDeleted.deletedCount} test users`);

        // 10. Clean up orphan batches (with no valid product)
        const orphanBatches = await ProductBatch.aggregate([
            {
                $lookup: {
                    from: 'products',
                    localField: 'productId',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $match: { product: { $size: 0 } } },
            { $project: { _id: 1 } }
        ]);
        if (orphanBatches.length > 0) {
            await ProductBatch.deleteMany({
                _id: { $in: orphanBatches.map(b => b._id) }
            });
            console.log(`🗑️  Deleted ${orphanBatches.length} orphan batches`);
        }

        console.log("\n✅ Cleanup completed successfully!");

    } catch (error) {
        console.error("❌ Error during cleanup:", error);
    } finally {
        await mongoose.disconnect();
        console.log("📤 Disconnected from database");
    }
};

cleanup();
