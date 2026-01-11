import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import csv from 'csv-parser';
import bcrypt from 'bcrypt';
import { Product } from '../models/product/Product.js';
import { Manufacturer } from '../models/manufacturer/Manufacturer.js';
import { Category } from '../models/product/Category.js';
import { ProductBatch } from '../models/product/ProductBatch.js';
import { Role } from '../models/auth/Role.js'; // Cần check path
import { User } from '../models/auth/User.js'; // Cần check path
import { PurchaseInvoice } from '../models/purchaseInvoice/PurchaseInvoice.js'; // Needed for batch

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

let processedCount = 0;

async function start() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Seed Roles & Users FIRST
        await seedAuth();

        const results = [];
        fs.createReadStream('../drug_data.csv')
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                console.log(`Parsed ${results.length} rows from CSV.`);
                await importProductsAndBatches(results);
            });
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
}

start();

async function seedAuth() {
    console.log('Seeding Roles and Users...');

    // 1. Roles
    const roles = ['Admin', 'Staff', 'Customer'];
    const roleDocs = {};

    for (const rName of roles) {
        let r = await Role.findOne({ roleName: rName });
        if (!r) {
            r = await Role.create({ roleName: rName });
            console.log(`Created Role: ${rName}`);
        }
        roleDocs[rName] = r._id;
    }

    // 2. Users
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt); // Default pass: 123456

    const users = [
        { userName: 'Admin User', email: 'admin@gmail.com', role: 'Admin' },
        { userName: 'Staff User', email: 'staff@example.com', role: 'Staff' },
        { userName: 'Test Customer', email: 'customer@gmail.com', role: 'Customer' }
    ];

    for (const u of users) {
        let user = await User.findOne({ email: u.email });
        if (!user) {
            await User.create({
                userName: u.userName,
                email: u.email,
                passWord: hashedPassword,
                roleId: roleDocs[u.role],
                phoneNum: '0123456789',
                address: 'HCM City',
                sex: true
            });
            console.log(`Created User: ${u.email} (Pass: 123456)`);
        }
    }
}

async function importProductsAndBatches(results) {
    try {
        const manufacturers = new Map();
        const categories = new Map();

        const existingMans = await Manufacturer.find();
        existingMans.forEach(m => manufacturers.set(m.manufacturerName, m._id));

        const existingCats = await Category.find();
        existingCats.forEach(c => categories.set(c.categoryName, c._id));

        console.log('Existing metadata loaded.');
        console.log('Sample row keys:', Object.keys(results[0]));

        // Cache invoices by manufacturer
        const invoiceMap = new Map(); // manufacturerId -> invoiceId

        for (let i = 0; i < results.length; i++) {
            const row = results[i];
            const cleanRow = {};
            Object.keys(row).forEach(key => {
                cleanRow[key.trim().replace(/^\ufeff/, '')] = row[key];
            });

            const productName = cleanRow['Product Name'];
            if (!productName) continue;

            const priceStr = cleanRow['Price'] || '0';
            let price = parseFloat(priceStr.replace(/\./g, '').replace('đ', '')) || 0;
            const unit = cleanRow['Unit'];

            // Logic phân loại & Xử lý giá
            let categoryName = 'Dược phẩm';

            if (price > 0) {
                // Có giá sẵn -> Thuốc KHÔNG theo đơn (Mua thoải mái)
                categoryName = 'Thuốc không theo đơn';
            } else {
                // Không có giá -> Thuốc theo đơn (Rx) - Cần liên hệ
                // Random giá cho quản lý
                price = Math.floor(Math.random() * (500000 - 50000 + 1)) + 50000;
                // Làm tròn về hàng nghìn
                price = Math.ceil(price / 1000) * 1000;

                categoryName = 'Thuốc theo đơn';
            }

            const manufacturerName = cleanRow['Manufacturer'] || 'Unknown';
            const packagingType = cleanRow['Unit'] || 'Hộp';
            const img = cleanRow['Image URL'];
            const description = cleanRow['Description'];

            // New Detailed Fields
            const ingredients = cleanRow['Thành phần'] || '';
            const usage = (cleanRow['Công dụng'] || '') + '\n' + (cleanRow['Cách dùng'] || '');
            const preservation = cleanRow['Bảo quản'] || '';
            const sideEffects = cleanRow['Tác dụng phụ'] || '';
            const precautions = cleanRow['Lưu ý'] || '';
            const origin = cleanRow['Origin'] || cleanRow['Xuất xứ'] || '';
            const brand = cleanRow['Brand'] || cleanRow['Thương hiệu'] || '';

            // Manufacturer
            let manufacturerId = manufacturers.get(manufacturerName);

            if (!manufacturerId) {
                const newMan = await Manufacturer.create({ manufacturerName });
                manufacturerId = newMan._id;
                manufacturers.set(manufacturerName, manufacturerId);
            }

            // Purchase Invoice for this Manufacturer
            let invoiceId = invoiceMap.get(manufacturerId);
            if (!invoiceId) {
                // Check DB for an invoice created today for this manufacturer
                const startOfDay = new Date();
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date();
                endOfDay.setHours(23, 59, 59, 999);

                const existingInv = await PurchaseInvoice.findOne({
                    manufacturerId: manufacturerId,
                    dateImport: { $gte: startOfDay, $lte: endOfDay }
                });

                if (existingInv) {
                    invoiceId = existingInv._id;
                } else {
                    const inv = await PurchaseInvoice.create({
                        manufacturerId: manufacturerId,
                        dateImport: new Date(),
                        totalBill: 0
                    });
                    invoiceId = inv._id;
                }
                invoiceMap.set(manufacturerId, invoiceId);
            }

            let categoryId = categories.get(categoryName);
            if (!categoryId) {
                const newCat = await Category.create({ categoryName });
                categoryId = newCat._id;
                categories.set(categoryName, categoryId);
            }

            // Product (Upsert to update Category based on new logic)
            let product = await Product.findOne({ productName });

            // Logic xử lý variants (Hộp, Vỉ, Viên)
            const currentVariant = { unit: unit, price: price };

            if (!product) {
                product = await Product.create({
                    productName, manufacturerId, categoryId, img, productDesc: description, packagingType, price, unit, status: true,
                    ingredients, usage, preservation, sideEffects, precautions, origin, brand,
                    variants: [currentVariant] // Khởi tạo variants
                });
            } else {
                let needSave = false;

                // 1. Check Variants: Nếu chưa có unit này thì thêm vào
                if (!product.variants) product.variants = [];
                const existingVariantIndex = product.variants.findIndex(v => v.unit === unit);

                if (existingVariantIndex === -1) {
                    // Chưa có unit này -> Thêm mới
                    product.variants.push(currentVariant);
                    needSave = true;
                } else {
                    // Đã có logic update price nếu thay đổi? Tạm thời giữ nguyên hoặc update
                    // Nếu giá CSV > 0 và khác giá cũ -> Update
                    if (price > 0 && product.variants[existingVariantIndex].price !== price) {
                        product.variants[existingVariantIndex].price = price;
                        needSave = true;
                    }
                }

                // 2. Update giá mặc định (Main Price) nếu cần
                // Ưu tiên hiển thị giá của đơn vị lớn nhất (thường là Hộp)? Hoặc giữ nguyên logic cũ?
                // Logic cũ: update price nếu đang là 0. 
                // Logic mới: Nếu unit hiện tại là "Hộp" mà giá đang hiển thị là "Viên" (giá thấp), có nên update lên Hộp?
                // Tạm thời user muốn list variants. Giá main price cứ để là giá của item đầu tiên hoặc logic cũ.

                // Logic Rx (Random Price) cho variants
                // Nếu price > 0 (OTC) -> Dùng price.
                // Nếu price = 0 (Rx) -> Đã random ở trên.
                // (Code random ở trên dòng 124 đã xử lý price)

                // 3. Update Category
                if (product.categoryId.toString() !== categoryId.toString()) {
                    product.categoryId = categoryId;
                    needSave = true;
                }

                // 4. Update Price Main (Nếu cũ = 0)
                if (product.price <= 0 && price > 0) {
                    product.price = price;
                    needSave = true;
                }

                // 5. Update Details
                if (!product.ingredients && ingredients) {
                    Object.assign(product, { ingredients, usage, preservation, sideEffects, precautions, origin, brand });
                    needSave = true;
                }

                if (needSave) {
                    await product.save();
                }
            }

            // --- Create Product Batch (Tồn kho) ---
            // Mỗi sản phẩm tạo 1 batch với số lượng 100
            const existingBatch = await ProductBatch.findOne({ productId: product._id });
            if (!existingBatch) {
                await ProductBatch.create({
                    productId: product._id,
                    purchaseInvoiceId: invoiceId, // Correct variable from loop
                    manufactureDate: new Date('2024-01-01'),
                    expiryDate: new Date('2026-12-31'),
                    quantity: 100,
                    remainingQuantity: 100,
                    dosage: 'Viên', // Giả định
                    administration: 'Uống' // Giả định
                });
            }

            processedCount++;
            if (processedCount % 100 === 0) {
                process.stdout.write(`Processed ${processedCount}/${results.length} items...\r`);
            }
        }

        console.log(`\nImport completed! Processed ${processedCount} products with Batches.`);
        process.exit(0);
    } catch (error) {
        console.error('\nError:', error);
        process.exit(1);
    }
}
