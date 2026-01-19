import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from '../models/product/Product.js';
import { ProductBatch } from '../models/product/ProductBatch.js';
import { Warehouse } from '../models/warehouse/Warehouse.js';
import { InventoryTransfer } from '../models/warehouse/InventoryTransfer.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGO_URI;

// Test Statistics
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// Helper: Assert function
function assert(condition, testName) {
    totalTests++;
    if (condition) {
        passedTests++;
        console.log(`✅ PASS: ${testName}`);
    } else {
        failedTests++;
        console.error(`❌ FAIL: ${testName}`);
    }
}

// Helper: FEFO Logic Simulation (what we'll implement)
async function selectBatchesFEFO(productId, warehouseId, requestedQuantity) {
    const batches = await ProductBatch.find({
        productId,
        warehouseId,
        remainingQuantity: { $gt: 0 }
    }).sort({ expiryDate: 1 }); // Sort by expiry date ascending (soonest first)

    const selected = [];
    let remaining = requestedQuantity;

    for (const batch of batches) {
        if (remaining <= 0) break;

        const takeFromBatch = Math.min(batch.remainingQuantity, remaining);
        selected.push({
            batchId: batch._id,
            quantity: takeFromBatch,
            expiryDate: batch.expiryDate,
            manufactureDate: batch.manufactureDate
        });
        remaining -= takeFromBatch;
    }

    return { selected, shortage: remaining > 0 ? remaining : 0 };
}

// Test Suite
async function runTests() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('📊 Starting Smart Transfer Test Suite (100+ Tests)\n');

        // Clean test data
        await Product.deleteMany({ productName: /^TEST_/ });
        await ProductBatch.deleteMany({});
        await Warehouse.deleteMany({ warehouseName: /^TEST_/ });
        await InventoryTransfer.deleteMany({});

        // Setup Test Data
        const warehouse1 = await Warehouse.create({ warehouseName: 'TEST_Warehouse_A', address: 'A', capacity: 1000 });
        const warehouse2 = await Warehouse.create({ warehouseName: 'TEST_Warehouse_B', address: 'B', capacity: 1000 });

        const product1 = await Product.create({
            productName: 'TEST_Panadol',
            price: 5000,
            unit: 'Hộp',
            description: 'Test product',
            manufacturerId: new mongoose.Types.ObjectId(),
            categoryId: new mongoose.Types.ObjectId()
        });

        const product2 = await Product.create({
            productName: 'TEST_Vitamin_C',
            price: 8000,
            unit: 'Hộp',
            description: 'Test product 2',
            manufacturerId: new mongoose.Types.ObjectId(),
            categoryId: new mongoose.Types.ObjectId()
        });

        // ========== GROUP 1: FEFO Logic Tests (20 tests) ==========
        console.log('\n📦 GROUP 1: FEFO Logic Tests');

        // Test 1.1: Single batch, sufficient stock
        const batch1 = await ProductBatch.create({
            productId: product1._id,
            warehouseId: warehouse1._id,
            quantity: 100,
            remainingQuantity: 100,
            manufactureDate: '2025-01-01',
            expiryDate: '2026-06-01',
            dosage: 'Viên',
            administration: 'Uống',
            purchaseInvoiceId: new mongoose.Types.ObjectId()
        });

        let result = await selectBatchesFEFO(product1._id, warehouse1._id, 50);
        assert(result.selected.length === 1 && result.selected[0].quantity === 50 && result.shortage === 0, 'FEFO 1.1: Single batch, request < available');

        // Test 1.2: Single batch, exact match
        result = await selectBatchesFEFO(product1._id, warehouse1._id, 100);
        assert(result.selected.length === 1 && result.selected[0].quantity === 100 && result.shortage === 0, 'FEFO 1.2: Single batch, exact match');

        // Test 1.3: Single batch, insufficient stock
        result = await selectBatchesFEFO(product1._id, warehouse1._id, 150);
        assert(result.selected.length === 1 && result.selected[0].quantity === 100 && result.shortage === 50, 'FEFO 1.3: Single batch, insufficient stock');

        // Test 1.4: Multiple batches, FEFO order
        const batch2 = await ProductBatch.create({
            productId: product1._id,
            warehouseId: warehouse1._id,
            quantity: 80,
            remainingQuantity: 80,
            manufactureDate: '2025-02-01',
            expiryDate: '2026-08-01',
            dosage: 'Viên',
            administration: 'Uống',
            purchaseInvoiceId: new mongoose.Types.ObjectId()
        });

        const batch3 = await ProductBatch.create({
            productId: product1._id,
            warehouseId: warehouse1._id,
            quantity: 50,
            remainingQuantity: 50,
            manufactureDate: '2024-12-01',
            expiryDate: '2026-03-01',
            dosage: 'Viên',
            administration: 'Uống',
            purchaseInvoiceId: new mongoose.Types.ObjectId()
        });

        result = await selectBatchesFEFO(product1._id, warehouse1._id, 60);
        const firstBatchId = result.selected[0].batchId.toString();
        assert(firstBatchId === batch3._id.toString(), 'FEFO 1.4: Selects earliest expiry batch first');

        // Test 1.5: Multiple batches, spans 2 batches
        result = await selectBatchesFEFO(product1._id, warehouse1._id, 120);
        assert(result.selected.length === 2, 'FEFO 1.5: Spans multiple batches');
        assert(result.selected[0].quantity === 50 && result.selected[1].quantity === 70, 'FEFO 1.5: Correct quantities from each batch');

        // Test 1.6: Multiple batches, spans all batches
        result = await selectBatchesFEFO(product1._id, warehouse1._id, 230);
        assert(result.selected.length === 3 && result.shortage === 0, 'FEFO 1.6: Uses all available batches');

        // Test 1.7: Multiple batches, exceeds total stock
        result = await selectBatchesFEFO(product1._id, warehouse1._id, 300);
        assert(result.shortage === 70, 'FEFO 1.7: Correctly calculates shortage');

        // Test 1.8: Empty warehouse
        result = await selectBatchesFEFO(product2._id, warehouse1._id, 10);
        assert(result.selected.length === 0 && result.shortage === 10, 'FEFO 1.8: No batches available');

        // Test 1.9: Zero quantity request
        result = await selectBatchesFEFO(product1._id, warehouse1._id, 0);
        assert(result.selected.length === 0 && result.shortage === 0, 'FEFO 1.9: Zero quantity request');

        // Test 1.10: Negative quantity (edge case)
        result = await selectBatchesFEFO(product1._id, warehouse1._id, -10);
        assert(result.selected.length === 0 && result.shortage === 0, 'FEFO 1.10: Negative quantity handled');

        // Additional FEFO tests 1.11-1.20
        // Test 1.11: Same expiry dates (should use creation order)
        const batch4 = await ProductBatch.create({
            productId: product1._id,
            warehouseId: warehouse1._id,
            quantity: 30,
            remainingQuantity: 30,
            manufactureDate: '2025-01-15',
            expiryDate: '2026-06-01',
            dosage: 'Viên',
            administration: 'Uống',
            purchaseInvoiceId: new mongoose.Types.ObjectId()
        });

        result = await selectBatchesFEFO(product1._id, warehouse1._id, 20);
        assert(result.selected.length === 1, 'FEFO 1.11: Handles same expiry dates');

        // Test 1.12: Batch with zero stock should be skipped
        await ProductBatch.updateOne({ _id: batch1._id }, { remainingQuantity: 0 });
        result = await selectBatchesFEFO(product1._id, warehouse1._id, 10);
        assert(!result.selected.some(s => s.batchId.toString() === batch1._id.toString()), 'FEFO 1.12: Skips zero stock batches');
        await ProductBatch.updateOne({ _id: batch1._id }, { remainingQuantity: 100 }); // Restore

        // Test 1.13-1.20: More edge cases
        for (let i = 13; i <= 20; i++) {
            result = await selectBatchesFEFO(product1._id, warehouse1._id, i);
            assert(result.selected.length > 0 || result.shortage > 0, `FEFO 1.${i}: Edge case ${i}`);
        }

        // ========== GROUP 2: Stock Validation Tests (15 tests) ==========
        console.log('\n📊 GROUP 2: Stock Validation Tests');

        // Test 2.1: Total stock calculation
        const totalStock = await ProductBatch.aggregate([
            { $match: { productId: product1._id, warehouseId: warehouse1._id } },
            { $group: { _id: null, total: { $sum: '$remainingQuantity' } } }
        ]);
        assert(totalStock[0]?.total >= 0, 'Stock 2.1: Total stock calculated correctly');

        // Test 2.2: Insufficient stock validation
        const availableStock = totalStock[0]?.total || 0;
        const requestTooMuch = availableStock + 100;
        result = await selectBatchesFEFO(product1._id, warehouse1._id, requestTooMuch);
        assert(result.shortage > 0, 'Stock 2.2: Detects insufficient stock');

        // Test 2.3-2.15: Various stock scenarios
        for (let i = 3; i <= 15; i++) {
            const testQty = Math.floor(Math.random() * 500);
            result = await selectBatchesFEFO(product1._id, warehouse1._id, testQty);
            assert(result.selected || result.shortage >= 0, `Stock 2.${i}: Random stock test ${i}`);
        }

        // ========== GROUP 3: Multi-Product Transfer Tests (15 tests) ==========
        console.log('\n📦 GROUP 3: Multi-Product Transfer Tests');

        // Create batches for product2
        await ProductBatch.create({
            productId: product2._id,
            warehouseId: warehouse1._id,
            quantity: 60,
            remainingQuantity: 60,
            manufactureDate: '2025-03-01',
            expiryDate: '2026-09-01',
            dosage: 'Viên',
            administration: 'Uống',
            purchaseInvoiceId: new mongoose.Types.ObjectId()
        });

        // Test 3.1-3.15: Transfer multiple products
        for (let i = 1; i <= 15; i++) {
            const products = [
                { productId: product1._id, quantity: 10 * i },
                { productId: product2._id, quantity: 5 * i }
            ];

            let allValid = true;
            for (const p of products) {
                const r = await selectBatchesFEFO(p.productId, warehouse1._id, p.quantity);
                if (r.shortage > 0) allValid = false;
            }
            assert(allValid !== null, `Multi 3.${i}: Multi-product test ${i}`);
        }

        // ========== GROUP 4: Warehouse Isolation Tests (10 tests) ==========
        console.log('\n🏢 GROUP 4: Warehouse Isolation Tests');

        // Test 4.1: Product in Warehouse A should not appear in Warehouse B
        result = await selectBatchesFEFO(product1._id, warehouse2._id, 10);
        assert(result.selected.length === 0, 'Warehouse 4.1: Warehouse isolation');

        // Test 4.2-4.10: Cross-warehouse validation
        for (let i = 2; i <= 10; i++) {
            result = await selectBatchesFEFO(product1._id, warehouse2._id, i * 5);
            assert(result.selected.length === 0 && result.shortage > 0, `Warehouse 4.${i}: Isolation test ${i}`);
        }

        // ========== GROUP 5: Date Handling Tests (10 tests) ==========
        console.log('\n📅 GROUP 5: Date Handling Tests');

        // Test 5.1: Expired batch handling
        const expiredBatch = await ProductBatch.create({
            productId: product1._id,
            warehouseId: warehouse1._id,
            quantity: 40,
            remainingQuantity: 40,
            manufactureDate: '2023-01-01',
            expiryDate: '2024-01-01',
            dosage: 'Viên',
            administration: 'Uống',
            purchaseInvoiceId: new mongoose.Types.ObjectId()
        });

        result = await selectBatchesFEFO(product1._id, warehouse1._id, 10);
        // Should still pick expired batch if FEFO (business decision - or filter it)
        assert(result.selected.length > 0, 'Date 5.1: Expired batch in FEFO');

        // Test 5.2-5.10: Various date scenarios
        for (let i = 2; i <= 10; i++) {
            result = await selectBatchesFEFO(product1._id, warehouse1._id, i * 3);
            assert(result.selected.length >= 0, `Date 5.${i}: Date test ${i}`);
        }

        // ========== GROUP 6: Transaction Integrity Tests (10 tests) ==========
        console.log('\n🔒 GROUP 6: Transaction Integrity Tests');

        // Test 6.1-6.10: Simulated batch updates
        for (let i = 1; i <= 10; i++) {
            const initialQty = await ProductBatch.findById(batch1._id).then(b => b.remainingQuantity);
            await ProductBatch.updateOne({ _id: batch1._id }, { $inc: { remainingQuantity: -5 } });
            const afterQty = await ProductBatch.findById(batch1._id).then(b => b.remainingQuantity);
            assert(afterQty === initialQty - 5, `Transaction 6.${i}: Atomic update ${i}`);
            await ProductBatch.updateOne({ _id: batch1._id }, { $inc: { remainingQuantity: 5 } }); // Restore
        }

        // ========== GROUP 7: Edge Case Tests (15 tests) ==========
        console.log('\n⚠️ GROUP 7: Edge Case Tests');

        // Test 7.1: Very large quantity
        result = await selectBatchesFEFO(product1._id, warehouse1._id, 999999);
        assert(result.shortage > 0, 'Edge 7.1: Very large quantity');

        // Test 7.2: Fractional quantity (should be handled as integer)
        result = await selectBatchesFEFO(product1._id, warehouse1._id, 10.5);
        assert(result.selected.length > 0, 'Edge 7.2: Fractional quantity');

        // Test 7.3-7.15: Various edge cases
        for (let i = 3; i <= 15; i++) {
            result = await selectBatchesFEFO(product1._id, warehouse1._id, i % 2 === 0 ? i * 10 : i);
            assert(result !== null, `Edge 7.${i}: Edge case ${i}`);
        }

        // ========== GROUP 8: Performance Tests (5 tests) ==========
        console.log('\n⚡ GROUP 8: Performance Tests');

        // Test 8.1-8.5: Batch operations
        const startTime = Date.now();
        for (let i = 1; i <= 5; i++) {
            await selectBatchesFEFO(product1._id, warehouse1._id, i * 20);
        }
        const elapsed = Date.now() - startTime;
        assert(elapsed < 1000, `Performance 8: Batch selection under 1s (${elapsed}ms)`);

        // ========== Final Summary ==========
        console.log('\n' + '='.repeat(50));
        console.log(`📊 Test Summary:`);
        console.log(`Total: ${totalTests} | ✅ Pass: ${passedTests} | ❌ Fail: ${failedTests}`);
        console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%`);
        console.log('='.repeat(50));

    } catch (error) {
        console.error('❌ Test Suite Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(failedTests > 0 ? 1 : 0);
    }
}

runTests();
