// Business Logic Integration Test Script (100 Tests)
// Simulates real warehouse manager actions and verifies cross-table data consistency
// Run: node scripts/testBusinessLogic.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Warehouse } from '../models/warehouse/Warehouse.js';
import { Product } from '../models/product/Product.js';
import { Category } from '../models/product/Category.js';
import { ProductBatch } from '../models/product/ProductBatch.js';
import { Manufacturer } from '../models/manufacturer/Manufacturer.js';
import { PurchaseInvoice } from '../models/purchaseInvoice/PurchaseInvoice.js';
import { PurchaseInvoiceDetail } from '../models/purchaseInvoice/PurchaseInvoiceDetail.js';
import { SaleInvoice } from '../models/saleInvoice/SaleInvoice.js';
import { SaleInvoiceDetail } from '../models/saleInvoice/SaleInvoiceDetail.js';
import { OrderStatus } from '../models/saleInvoice/OrderStatus.js';
import { InventoryTransfer } from '../models/warehouse/InventoryTransfer.js';

dotenv.config();

let pass = 0, fail = 0;
const failures = [];

const test = async (name, fn) => {
    try {
        await fn();
        pass++;
    } catch (e) {
        fail++;
        failures.push(`${name}: ${e.message}`);
    }
    if ((pass + fail) % 20 === 0) process.stdout.write(` [${pass + fail}/100]\r`);
};

const assertEquals = (actual, expected, msg) => {
    if (actual !== expected) throw new Error(`${msg}: Expected ${expected}, got ${actual}`);
};

const assertNotNull = (val, msg) => {
    if (val === null || val === undefined) throw new Error(`${msg}: Value is null/undefined`);
};

let mock = {};

const setup = async () => {
    // Clean previous test data
    await Promise.all([
        Warehouse.deleteMany({ warehouseName: /^BIZ_/ }),
        Product.deleteMany({ productName: /^BIZ_/ }),
        Category.deleteMany({ categoryName: /^BIZ_/ }),
        Manufacturer.deleteMany({ manufacturerName: /^BIZ_/ }),
        PurchaseInvoice.deleteMany({ totalBill: 999999 }),
        SaleInvoice.deleteMany({ note: 'BIZ_TEST' }),
        InventoryTransfer.deleteMany({ note: 'BIZ_TEST' })
    ]);

    // Base data
    const central = await Warehouse.create({ warehouseName: 'BIZ_CENTRAL', warehouseType: 'central' });
    const branch1 = await Warehouse.create({ warehouseName: 'BIZ_BRANCH_1', warehouseType: 'branch' });
    const branch2 = await Warehouse.create({ warehouseName: 'BIZ_BRANCH_2', warehouseType: 'branch' });
    const cat = await Category.create({ categoryName: 'BIZ_CAT' });
    const manu = await Manufacturer.create({ manufacturerName: 'BIZ_MANU' });
    const product = await Product.create({
        productName: 'BIZ_PANADOL',
        categoryId: cat._id,
        manufacturerId: manu._id,
        price: 5000,
        unit: 'Hộp'
    });

    let pendingStatus = await OrderStatus.findOne({ statusName: 'Pending' });
    if (!pendingStatus) pendingStatus = await OrderStatus.create({ statusName: 'Pending' });
    let confirmedStatus = await OrderStatus.findOne({ statusName: 'Confirmed' });
    if (!confirmedStatus) confirmedStatus = await OrderStatus.create({ statusName: 'Confirmed' });

    mock = { central, branch1, branch2, product, manu, pendingStatus, confirmedStatus };
};

// ==================== GROUP A: IMPORT/PURCHASE (25 Tests) ====================
const testGroupA = async () => {
    console.log("\n[Group A] Import/Purchase Tests...");

    // A1-A5: Create PurchaseInvoice and verify batch creation
    for (let i = 1; i <= 5; i++) {
        await test(`A${i}_CreatePurchaseInvoice`, async () => {
            const pi = await PurchaseInvoice.create({
                manufacturerId: mock.manu._id,
                warehouseId: mock.central._id,
                dateImport: new Date(),
                totalBill: 999999
            });
            assertNotNull(pi._id, "PurchaseInvoice created");

            // Create batch linked to this invoice
            const batch = await ProductBatch.create({
                productId: mock.product._id,
                purchaseInvoiceId: pi._id,
                warehouseId: mock.central._id,
                quantity: 100 * i,
                remainingQuantity: 100 * i,
                manufactureDate: new Date(),
                expiryDate: new Date(Date.now() + 86400000 * 365),
                dosage: '500mg',
                administration: 'Oral'
            });

            // Verify batch is linked
            assertEquals(batch.purchaseInvoiceId.toString(), pi._id.toString(), "Batch linked to Invoice");
            assertEquals(batch.warehouseId.toString(), mock.central._id.toString(), "Batch in Central warehouse");
        });
    }

    // A6-A10: Edit PurchaseInvoice date and verify no side effects
    for (let i = 6; i <= 10; i++) {
        await test(`A${i}_EditPurchaseInvoiceDate`, async () => {
            const pi = await PurchaseInvoice.create({
                manufacturerId: mock.manu._id,
                warehouseId: mock.central._id,
                dateImport: new Date(),
                totalBill: 999999
            });
            const batch = await ProductBatch.create({
                productId: mock.product._id,
                purchaseInvoiceId: pi._id,
                warehouseId: mock.central._id,
                quantity: 50,
                remainingQuantity: 50,
                manufactureDate: new Date(),
                expiryDate: new Date(Date.now() + 86400000 * 365),
                dosage: '500mg', administration: 'Oral'
            });

            // Change date
            const newDate = new Date('2025-01-01');
            pi.dateImport = newDate;
            await pi.save();

            // Verify batch is unaffected
            const checkBatch = await ProductBatch.findById(batch._id);
            assertEquals(checkBatch.quantity, 50, "Batch quantity unchanged");
        });
    }

    // A11-A15: Delete empty PurchaseInvoice (no batches sold)
    for (let i = 11; i <= 15; i++) {
        await test(`A${i}_DeleteEmptyPurchaseInvoice`, async () => {
            const pi = await PurchaseInvoice.create({
                manufacturerId: mock.manu._id,
                warehouseId: mock.central._id,
                dateImport: new Date(),
                totalBill: 999999
            });
            const batch = await ProductBatch.create({
                productId: mock.product._id,
                purchaseInvoiceId: pi._id,
                warehouseId: mock.central._id,
                quantity: 10, remainingQuantity: 10,
                manufactureDate: new Date(),
                expiryDate: new Date(Date.now() + 86400000 * 100),
                dosage: '10mg', administration: 'Oral'
            });

            // Delete invoice (should cascade delete batch if not sold)
            await PurchaseInvoice.findByIdAndDelete(pi._id);

            // Verify batch is also deleted
            const checkBatch = await ProductBatch.findById(batch._id);
            if (checkBatch) throw new Error("Batch should be cascade deleted");
        });
    }

    // A16-A20: Fail to delete PurchaseInvoice with sold batches
    for (let i = 16; i <= 20; i++) {
        await test(`A${i}_FailDeleteUsedPurchaseInvoice`, async () => {
            const pi = await PurchaseInvoice.create({
                manufacturerId: mock.manu._id,
                warehouseId: mock.central._id,
                dateImport: new Date(),
                totalBill: 999999
            });
            const batch = await ProductBatch.create({
                productId: mock.product._id,
                purchaseInvoiceId: pi._id,
                warehouseId: mock.central._id,
                quantity: 100, remainingQuantity: 50, // Already sold 50!
                manufactureDate: new Date(),
                expiryDate: new Date(Date.now() + 86400000 * 100),
                dosage: '10mg', administration: 'Oral'
            });

            // Try delete - should fail
            try {
                await PurchaseInvoice.findByIdAndDelete(pi._id);
                throw new Error("Should have blocked delete");
            } catch (e) {
                if (!e.message.toLowerCase().includes('không thể xóa')) throw e;
            }
        });
    }

    // A21-A25: Create batch with invalid data (should fail)
    for (let i = 21; i <= 25; i++) {
        await test(`A${i}_FailCreateInvalidBatch`, async () => {
            try {
                await ProductBatch.create({
                    productId: mock.product._id,
                    purchaseInvoiceId: new mongoose.Types.ObjectId(),
                    warehouseId: mock.central._id,
                    quantity: -10, // Invalid!
                    remainingQuantity: -10,
                    manufactureDate: new Date(),
                    expiryDate: new Date(Date.now() + 86400000),
                    dosage: '10mg', administration: 'Oral'
                });
                throw new Error("Should have failed");
            } catch (e) {
                if (!e.message.includes('validation')) throw e;
            }
        });
    }
};

// ==================== GROUP B: BATCH MANAGEMENT (25 Tests) ====================
const testGroupB = async () => {
    console.log("\n[Group B] Batch Management Tests...");

    // B1-B5: Edit batch quantity (increase)
    for (let i = 1; i <= 5; i++) {
        await test(`B${i}_IncreaseBatchQuantity`, async () => {
            const batch = await ProductBatch.create({
                productId: mock.product._id,
                purchaseInvoiceId: new mongoose.Types.ObjectId(),
                warehouseId: mock.central._id,
                quantity: 100, remainingQuantity: 100,
                manufactureDate: new Date(),
                expiryDate: new Date(Date.now() + 86400000 * 365),
                dosage: '10mg', administration: 'Oral'
            });

            // Increase
            batch.quantity = 150;
            batch.remainingQuantity = 150;
            await batch.save();

            const check = await ProductBatch.findById(batch._id);
            assertEquals(check.quantity, 150, "Quantity increased");
        });
    }

    // B6-B10: Edit batch quantity (decrease) - Valid
    for (let i = 6; i <= 10; i++) {
        await test(`B${i}_DecreaseBatchQuantityValid`, async () => {
            const batch = await ProductBatch.create({
                productId: mock.product._id,
                purchaseInvoiceId: new mongoose.Types.ObjectId(),
                warehouseId: mock.central._id,
                quantity: 100, remainingQuantity: 100,
                manufactureDate: new Date(),
                expiryDate: new Date(Date.now() + 86400000 * 365),
                dosage: '10mg', administration: 'Oral'
            });

            // Decrease (valid - remaining still <= quantity)
            batch.quantity = 80;
            batch.remainingQuantity = 80;
            await batch.save();

            assertEquals((await ProductBatch.findById(batch._id)).quantity, 80, "Quantity decreased");
        });
    }

    // B11-B15: Fail to set remaining > quantity
    for (let i = 11; i <= 15; i++) {
        await test(`B${i}_FailRemainingGreaterThanQuantity`, async () => {
            const batch = await ProductBatch.create({
                productId: mock.product._id,
                purchaseInvoiceId: new mongoose.Types.ObjectId(),
                warehouseId: mock.central._id,
                quantity: 100, remainingQuantity: 100,
                manufactureDate: new Date(),
                expiryDate: new Date(Date.now() + 86400000 * 365),
                dosage: '10mg', administration: 'Oral'
            });

            batch.remainingQuantity = 150; // Invalid!
            try {
                await batch.save();
                throw new Error("Should have failed");
            } catch (e) {
                if (!e.message.includes('không hợp lệ')) throw e;
            }
        });
    }

    // B16-B20: Edit expiry date (extend)
    for (let i = 16; i <= 20; i++) {
        await test(`B${i}_ExtendExpiryDate`, async () => {
            const batch = await ProductBatch.create({
                productId: mock.product._id,
                purchaseInvoiceId: new mongoose.Types.ObjectId(),
                warehouseId: mock.central._id,
                quantity: 100, remainingQuantity: 100,
                manufactureDate: new Date(),
                expiryDate: new Date(Date.now() + 86400000 * 10),
                dosage: '10mg', administration: 'Oral'
            });

            const newExpiry = new Date(Date.now() + 86400000 * 500);
            batch.expiryDate = newExpiry;
            await batch.save();

            assertEquals((await ProductBatch.findById(batch._id)).expiryDate.getTime(), newExpiry.getTime(), "Expiry extended");
        });
    }

    // B21-B25: Fail to set expiry before manufacture
    for (let i = 21; i <= 25; i++) {
        await test(`B${i}_FailExpiryBeforeManufacture`, async () => {
            const batch = await ProductBatch.create({
                productId: mock.product._id,
                purchaseInvoiceId: new mongoose.Types.ObjectId(),
                warehouseId: mock.central._id,
                quantity: 100, remainingQuantity: 100,
                manufactureDate: new Date(),
                expiryDate: new Date(Date.now() + 86400000 * 10),
                dosage: '10mg', administration: 'Oral'
            });

            batch.expiryDate = new Date(Date.now() - 86400000); // Before now (probably before manufacture)
            try {
                await batch.save();
                throw new Error("Should have failed");
            } catch (e) {
                if (!e.message.includes('sau ngày sản xuất')) throw e;
            }
        });
    }
};

// ==================== GROUP C: TRANSFERS (25 Tests) ====================
const testGroupC = async () => {
    console.log("\n[Group C] Transfer Tests...");

    // C1-C5: Create valid transfer Central -> Branch
    for (let i = 1; i <= 5; i++) {
        await test(`C${i}_CreateValidTransfer`, async () => {
            // Create source batch
            const batch = await ProductBatch.create({
                productId: mock.product._id,
                purchaseInvoiceId: new mongoose.Types.ObjectId(),
                warehouseId: mock.central._id,
                quantity: 100, remainingQuantity: 100,
                manufactureDate: new Date(),
                expiryDate: new Date(Date.now() + 86400000 * 365),
                dosage: '10mg', administration: 'Oral'
            });

            const transfer = await InventoryTransfer.create({
                fromWarehouseId: mock.central._id,
                toWarehouseId: mock.branch1._id,
                productBatchId: batch._id,
                quantity: 20 * i,
                status: 'Pending',
                note: 'BIZ_TEST'
            });

            assertNotNull(transfer._id, "Transfer created");
            assertEquals(transfer.status, 'Pending', "Status is Pending");
        });
    }

    // C6-C10: Fail transfer to same warehouse
    for (let i = 6; i <= 10; i++) {
        await test(`C${i}_FailSameWarehouseTransfer`, async () => {
            try {
                await InventoryTransfer.create({
                    fromWarehouseId: mock.central._id,
                    toWarehouseId: mock.central._id, // Same!
                    productBatchId: new mongoose.Types.ObjectId(),
                    quantity: 10,
                    status: 'Pending',
                    note: 'BIZ_TEST'
                });
                throw new Error("Should have failed");
            } catch (e) {
                if (!e.message.includes('không được trùng')) throw e;
            }
        });
    }

    // C11-C15: Transfer with 0 or negative quantity
    for (let i = 11; i <= 15; i++) {
        await test(`C${i}_FailZeroQuantityTransfer`, async () => {
            try {
                await InventoryTransfer.create({
                    fromWarehouseId: mock.central._id,
                    toWarehouseId: mock.branch1._id,
                    productBatchId: new mongoose.Types.ObjectId(),
                    quantity: i <= 13 ? 0 : -5, // 0 or negative
                    status: 'Pending',
                    note: 'BIZ_TEST'
                });
                throw new Error("Should have failed");
            } catch (e) {
                if (!e.message.includes('validation')) throw e;
            }
        });
    }

    // C16-C20: Update transfer status
    for (let i = 16; i <= 20; i++) {
        await test(`C${i}_UpdateTransferStatus`, async () => {
            const transfer = await InventoryTransfer.create({
                fromWarehouseId: mock.central._id,
                toWarehouseId: mock.branch1._id,
                productBatchId: new mongoose.Types.ObjectId(),
                quantity: 10,
                status: 'Pending',
                note: 'BIZ_TEST'
            });

            transfer.status = 'Completed';
            await transfer.save();

            assertEquals((await InventoryTransfer.findById(transfer._id)).status, 'Completed', "Status updated");
        });
    }

    // C21-C25: Cancel transfer
    for (let i = 21; i <= 25; i++) {
        await test(`C${i}_CancelTransfer`, async () => {
            const transfer = await InventoryTransfer.create({
                fromWarehouseId: mock.central._id,
                toWarehouseId: mock.branch1._id,
                productBatchId: new mongoose.Types.ObjectId(),
                quantity: 10,
                status: 'Pending',
                note: 'BIZ_TEST'
            });

            transfer.status = 'Cancelled';
            await transfer.save();

            assertEquals((await InventoryTransfer.findById(transfer._id)).status, 'Cancelled', "Transfer cancelled");
        });
    }
};

// ==================== GROUP D: SALES & STOCK DEDUCTION (25 Tests) ====================
const testGroupD = async () => {
    console.log("\n[Group D] Sales & Stock Tests...");

    // D1-D5: Create sale and verify stock deduction
    for (let i = 1; i <= 5; i++) {
        await test(`D${i}_CreateSaleAndDeductStock`, async () => {
            // Create batch
            const batch = await ProductBatch.create({
                productId: mock.product._id,
                purchaseInvoiceId: new mongoose.Types.ObjectId(),
                warehouseId: mock.central._id,
                quantity: 100, remainingQuantity: 100,
                manufactureDate: new Date(),
                expiryDate: new Date(Date.now() + 86400000 * 365),
                dosage: '10mg', administration: 'Oral'
            });

            // Create order
            const order = await SaleInvoice.create({
                userId: new mongoose.Types.ObjectId(),
                statusId: mock.pendingStatus._id,
                warehouseId: mock.central._id,
                note: 'BIZ_TEST'
            });

            // Add detail - should NOT auto-deduct (controller handles this)
            await SaleInvoiceDetail.create({
                saleInvoiceId: order._id,
                batchId: batch._id,
                productId: mock.product._id,
                quantity: 10 * i,
                unitPrice: 5000,
                totalPrice: 50000 * i
            });

            // Manual deduction simulation (what controller would do)
            batch.remainingQuantity -= 10 * i;
            await batch.save();

            // Verify
            const checkBatch = await ProductBatch.findById(batch._id);
            assertEquals(checkBatch.remainingQuantity, 100 - 10 * i, "Stock deducted correctly");
        });
    }

    // D6-D10: Fail to sell more than remaining stock
    for (let i = 6; i <= 10; i++) {
        await test(`D${i}_FailSellMoreThanStock`, async () => {
            const batch = await ProductBatch.create({
                productId: mock.product._id,
                purchaseInvoiceId: new mongoose.Types.ObjectId(),
                warehouseId: mock.central._id,
                quantity: 10, remainingQuantity: 10,
                manufactureDate: new Date(),
                expiryDate: new Date(Date.now() + 86400000 * 365),
                dosage: '10mg', administration: 'Oral'
            });

            // Try to sell 50 when only 10 available
            // This is logic-level, not schema-level. Schema allows, controller should block.
            // For this test, we verify the "remaining >= sell qty" logic
            batch.remainingQuantity -= 50; // Try to deduct 50
            try {
                await batch.save(); // Remaining would be -40
                throw new Error("Should fail - negative stock");
            } catch (e) {
                if (!e.message.includes('không hợp lệ')) throw e;
            }
        });
    }

    // D11-D15: Edit order quantity (increase)
    for (let i = 11; i <= 15; i++) {
        await test(`D${i}_EditOrderQuantityIncrease`, async () => {
            const batch = await ProductBatch.create({
                productId: mock.product._id,
                purchaseInvoiceId: new mongoose.Types.ObjectId(),
                warehouseId: mock.central._id,
                quantity: 100, remainingQuantity: 90, // Already sold 10
                manufactureDate: new Date(),
                expiryDate: new Date(Date.now() + 86400000 * 365),
                dosage: '10mg', administration: 'Oral'
            });

            const order = await SaleInvoice.create({
                userId: new mongoose.Types.ObjectId(),
                statusId: mock.pendingStatus._id,
                warehouseId: mock.central._id,
                note: 'BIZ_TEST'
            });

            const detail = await SaleInvoiceDetail.create({
                saleInvoiceId: order._id,
                batchId: batch._id,
                productId: mock.product._id,
                quantity: 10,
                unitPrice: 5000,
                totalPrice: 50000
            });

            // Increase qty from 10 to 20
            detail.quantity = 20;
            detail.totalPrice = 100000;
            await detail.save();

            // Controller would deduct 10 more
            batch.remainingQuantity -= 10;
            await batch.save();

            assertEquals((await ProductBatch.findById(batch._id)).remainingQuantity, 80, "Additional stock deducted");
        });
    }

    // D16-D20: Cancel order and refund stock
    for (let i = 16; i <= 20; i++) {
        await test(`D${i}_CancelOrderRefundStock`, async () => {
            const batch = await ProductBatch.create({
                productId: mock.product._id,
                purchaseInvoiceId: new mongoose.Types.ObjectId(),
                warehouseId: mock.central._id,
                quantity: 100, remainingQuantity: 90, // Sold 10
                manufactureDate: new Date(),
                expiryDate: new Date(Date.now() + 86400000 * 365),
                dosage: '10mg', administration: 'Oral'
            });

            const order = await SaleInvoice.create({
                userId: new mongoose.Types.ObjectId(),
                statusId: mock.pendingStatus._id,
                warehouseId: mock.central._id,
                note: 'BIZ_TEST'
            });

            await SaleInvoiceDetail.create({
                saleInvoiceId: order._id,
                batchId: batch._id,
                productId: mock.product._id,
                quantity: 10,
                unitPrice: 5000,
                totalPrice: 50000
            });

            // Cancel order - refund stock
            batch.remainingQuantity += 10;
            await batch.save();

            // Delete detail and order
            await SaleInvoiceDetail.deleteMany({ saleInvoiceId: order._id });
            await SaleInvoice.findByIdAndDelete(order._id);

            assertEquals((await ProductBatch.findById(batch._id)).remainingQuantity, 100, "Stock refunded");
        });
    }

    // D21-D25: Change order status flow
    for (let i = 21; i <= 25; i++) {
        await test(`D${i}_ChangeOrderStatusFlow`, async () => {
            const order = await SaleInvoice.create({
                userId: new mongoose.Types.ObjectId(),
                statusId: mock.pendingStatus._id,
                warehouseId: mock.central._id,
                note: 'BIZ_TEST'
            });

            // Pending -> Confirmed
            order.statusId = mock.confirmedStatus._id;
            await order.save();

            const check = await SaleInvoice.findById(order._id);
            assertEquals(check.statusId.toString(), mock.confirmedStatus._id.toString(), "Status changed to Confirmed");
        });
    }
};

// ==================== RUN ALL ====================
const runAll = async () => {
    console.log("🚀 Starting Business Logic Tests (100 Tests)...");
    try {
        await mongoose.connect(process.env.MONGO_URI);
        await setup();

        await testGroupA(); // 25
        await testGroupB(); // 25
        await testGroupC(); // 25
        await testGroupD(); // 25

        console.log("\n=================================");
        console.log(`✅ PASS: ${pass}`);
        console.log(`❌ FAIL: ${fail}`);
        console.log("=================================\n");

        if (failures.length > 0) {
            console.log("Failures:");
            failures.slice(0, 15).forEach(f => console.log(f));
            if (failures.length > 15) console.log(`...and ${failures.length - 15} more`);
        }

    } catch (e) {
        console.error("Critical:", e);
    } finally {
        await mongoose.disconnect();
    }
};

runAll();
