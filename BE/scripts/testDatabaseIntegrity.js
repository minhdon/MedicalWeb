// Comprehensive Test Script for Database Integrity
// Run: node scripts/testDatabaseIntegrity.js

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
import { User } from '../models/auth/User.js';
import { Role } from '../models/auth/Role.js';

dotenv.config();

const testResults = [];

const log = (testName, passed, details) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${testName}`);
    if (details) console.log(`   └── ${details}`);
    testResults.push({ testName, passed, details });
};

// ==================== SEED DATA ====================
const seedTestData = async () => {
    console.log('\n📦 Tạo dữ liệu test...\n');

    // Clear existing test data
    await Warehouse.deleteMany({ warehouseName: /^TEST_/ });
    await Product.deleteMany({ productName: /^TEST_/ });
    await Manufacturer.deleteMany({ manufacturerName: /^TEST_/ });
    await Category.deleteMany({ categoryName: /^TEST_/ });

    // 1. Create Warehouses (1 Central + 2 Branches)
    const centralWarehouse = await Warehouse.create({
        warehouseName: 'TEST_KHO_TONG',
        address: 'Kho tổng chính',
        status: true
    });

    const branch1 = await Warehouse.create({
        warehouseName: 'TEST_CHI_NHANH_1',
        address: 'Chi nhánh Quận 1',
        status: true
    });

    const branch2 = await Warehouse.create({
        warehouseName: 'TEST_CHI_NHANH_2',
        address: 'Chi nhánh Quận 2',
        status: true
    });

    // 2. Create Manufacturer
    const manufacturer = await Manufacturer.create({
        manufacturerName: 'TEST_NCC_PHARMA',
        country: 'Vietnam'
    });

    // 3. Create Category first
    const category = await Category.create({
        categoryName: 'TEST_CATEGORY'
    });

    // 4. Create Product with categoryId
    const product = await Product.create({
        productName: 'TEST_THUOC_A',
        categoryId: category._id,
        manufacturerId: manufacturer._id,
        price: 50000,
        isPrescriptionRequired: false,
        unit: 'Hộp',
        description: 'Thuốc test'
    });

    // 4. Create PurchaseInvoice (Import to Central Warehouse)
    const purchaseInvoice = await PurchaseInvoice.create({
        manufacturerId: manufacturer._id,
        dateImport: new Date(),
        totalBill: 500000
        // ❌ ISSUE: No warehouseId - where does this stock go?
    });

    await PurchaseInvoiceDetail.create({
        purchaseInvoiceId: purchaseInvoice._id,
        productId: product._id,
        quantity: 100,
        unitPrice: 5000,
        totalPrice: 500000
    });

    // 5. Create ProductBatch (Stock)
    const batch = await ProductBatch.create({
        productId: product._id,
        purchaseInvoiceId: purchaseInvoice._id,
        manufactureDate: new Date(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        quantity: 100,
        remainingQuantity: 100,
        dosage: '500mg',
        administration: 'Uống'
        // ❌ ISSUE: No warehouseId - which warehouse holds this stock?
    });

    // 6. Create Customer
    let customerRole = await Role.findOne({ roleName: 'Customer' });
    if (!customerRole) {
        customerRole = await Role.create({ roleName: 'Customer' });
    }

    let customer = await User.findOne({ userName: 'test_customer' });
    if (!customer) {
        customer = await User.create({
            fullName: 'TEST_KHACH_HANG',
            userName: 'test_customer',
            phoneNum: '0999999999',
            passWord: 'test123',
            roleId: customerRole._id
        });
    }

    // 7. Create OrderStatus
    let pendingStatus = await OrderStatus.findOne({ statusName: 'Pending' });
    if (!pendingStatus) {
        pendingStatus = await OrderStatus.create({ statusName: 'Pending' });
    }

    // 8. Create SaleInvoice (Order) - Sell 50 units
    const order = await SaleInvoice.create({
        userId: customer._id,
        warehouseId: branch1._id, // Assigned to branch 1
        saleDate: new Date(),
        statusId: pendingStatus._id,
        totalAmount: 2500000,
        paymentMethod: 'COD',
        isInStoreSale: false
    });

    // 9. Create SaleInvoiceDetail - Deduct from batch
    await SaleInvoiceDetail.create({
        saleInvoiceId: order._id,
        batchId: batch._id,
        productId: product._id,
        quantity: 50,
        unitPrice: 50000,
        totalPrice: 2500000
    });

    // Update batch remaining quantity
    batch.remainingQuantity = 50; // 100 - 50 = 50 remaining
    await batch.save();

    console.log('✅ Dữ liệu test đã tạo xong\n');

    return {
        centralWarehouse,
        branch1,
        branch2,
        manufacturer,
        product,
        purchaseInvoice,
        batch,
        customer,
        order
    };
};

// ==================== TEST CASES ====================

const runTests = async (data) => {
    console.log('🧪 Chạy Test Cases...\n');

    // TC1: Xóa phiếu nhập khi lô hàng đã xuất
    const tc1 = async () => {
        const batch = await ProductBatch.findById(data.batch._id);
        const hasBeenSold = batch.remainingQuantity < batch.quantity;

        if (hasBeenSold) {
            // This would cause orphan batch if we delete purchase invoice
            log(
                'TC1: Xóa phiếu nhập khi lô hàng đã xuất',
                false,
                `Lô ${batch._id} đã bán ${batch.quantity - batch.remainingQuantity} SP. Xóa phiếu nhập sẽ gây orphan data!`
            );
        }
    };

    // TC2: Sửa số lượng lô hàng < số đã bán
    const tc2 = async () => {
        const batch = await ProductBatch.findById(data.batch._id);
        const soldQty = batch.quantity - batch.remainingQuantity;

        // Try to set quantity less than sold
        const newQty = 30; // Less than 50 sold

        if (newQty < soldQty) {
            log(
                'TC2: Sửa số lượng lô < số đã bán',
                false,
                `Cố set quantity=${newQty} nhưng đã bán ${soldQty}. Sẽ gây remainingQuantity âm!`
            );
        }
    };

    // TC3: Đổi chi nhánh đơn hàng - kho nào bị ảnh hưởng?
    const tc3 = async () => {
        const order = await SaleInvoice.findById(data.order._id)
            .populate('warehouseId');
        const batch = await ProductBatch.findById(data.batch._id);

        // Batch không có warehouseId nên không biết trả kho về đâu
        const hasWarehouseOnBatch = !!batch.warehouseId;

        log(
            'TC3: Đổi chi nhánh đơn hàng',
            hasWarehouseOnBatch,
            hasWarehouseOnBatch
                ? `Batch có warehouseId, có thể hoàn kho chính xác`
                : `❌ Batch KHÔNG CÓ warehouseId. Đổi chi nhánh sẽ không biết hoàn kho nào!`
        );
    };

    // TC4: Thêm SP vào đơn khi kho không đủ
    const tc4 = async () => {
        const batch = await ProductBatch.findById(data.batch._id);
        const wantToAdd = 60; // Want more than remaining (50)

        if (wantToAdd > batch.remainingQuantity) {
            log(
                'TC4: Thêm SP vào đơn khi kho không đủ',
                false,
                `Muốn thêm ${wantToAdd} nhưng chỉ còn ${batch.remainingQuantity}. Cần validation!`
            );
        }
    };

    // TC5: Xóa đơn hàng - hoàn kho đúng chưa?
    const tc5 = async () => {
        const detail = await SaleInvoiceDetail.findOne({ saleInvoiceId: data.order._id });
        const batch = await ProductBatch.findById(detail.batchId);

        // Nếu xóa đơn, cần cộng lại detail.quantity vào batch.remainingQuantity
        // Nhưng batch không có warehouseId, không biết kho chi nhánh nào được hoàn
        log(
            'TC5: Xóa đơn hàng - hoàn kho',
            false,
            `Xóa đơn cần hoàn ${detail.quantity} SP. ProductBatch không có warehouseId → không biết chi nhánh nào được hoàn kho!`
        );
    };

    // TC6: Kiểm tra SaleInvoice.warehouseId vs ProductBatch thiếu warehouseId
    const tc6 = async () => {
        const order = await SaleInvoice.findById(data.order._id);
        const detail = await SaleInvoiceDetail.findOne({ saleInvoiceId: order._id });
        const batch = await ProductBatch.findById(detail.batchId);

        // Order gán chi nhánh nhưng batch không có 
        const mismatch = order.warehouseId && !batch.warehouseId;

        log(
            'TC6: SaleInvoice có warehouseId vs Batch không có',
            !mismatch,
            mismatch
                ? `❌ Order gán chi nhánh ${order.warehouseId} nhưng Batch không track warehouse → Logic tách kho không hoạt động!`
                : `OK`
        );
    };

    // TC7: PurchaseInvoice không có warehouseId
    const tc7 = async () => {
        const pi = await PurchaseInvoice.findById(data.purchaseInvoice._id);

        log(
            'TC7: PurchaseInvoice thiếu warehouseId',
            !!pi.warehouseId,
            pi.warehouseId
                ? `PurchaseInvoice nhập vào kho ${pi.warehouseId}`
                : `❌ PurchaseInvoice KHÔNG CÓ warehouseId. Không biết hàng nhập vào kho nào!`
        );
    };

    // Run all tests
    await tc1();
    await tc2();
    await tc3();
    await tc4();
    await tc5();
    await tc6();
    await tc7();
};

// ==================== SUMMARY ====================
const printSummary = () => {
    console.log('\n' + '='.repeat(50));
    console.log('📊 TỔNG KẾT TEST');
    console.log('='.repeat(50));

    const passed = testResults.filter(t => t.passed).length;
    const failed = testResults.filter(t => !t.passed).length;

    console.log(`\n✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📝 Total:  ${testResults.length}`);

    if (failed > 0) {
        console.log('\n⚠️  CÁC VẤN ĐỀ CẦN SỬA:');
        testResults.filter(t => !t.passed).forEach((t, i) => {
            console.log(`\n${i + 1}. ${t.testName}`);
            console.log(`   └── ${t.details}`);
        });
    }

    console.log('\n' + '='.repeat(50));
    console.log('📋 ĐỀ XUẤT CẢI THIỆN DATABASE:');
    console.log('='.repeat(50));
    console.log(`
1. ProductBatch: Thêm warehouseId (required)
   → Biết lô hàng thuộc kho nào

2. PurchaseInvoice: Thêm warehouseId (default = Kho Tổng)
   → Biết nhập hàng vào kho nào

3. Warehouse: Thêm warehouseType ('central' | 'branch')
   → Phân biệt kho tổng và chi nhánh

4. [NEW] InventoryTransfer model:
   → Ghi nhận chuyển kho giữa Kho Tổng → Chi Nhánh
   
5. Validation: remainingQuantity >= 0 always
   → Không cho phép trừ kho âm
`);
};

// ==================== MAIN ====================
const main = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB\n');

        const data = await seedTestData();
        await runTests(data);
        printSummary();

    } catch (error) {
        console.error('Lỗi:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

main();
