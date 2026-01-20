/**
 * Script cập nhật thông tin chi tiết sản phẩm từ file CSV
 * Cập nhật các trường: ingredients, usage, dosage, sideEffects, precautions, preservation
 * 
 * Chạy: node scripts/updateProductDetails.js
 */
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import dotenv from 'dotenv';

dotenv.config();

// Import Product model
import { Product } from '../models/product/Product.js';

const MONGO_URI = process.env.MONGO_URI;
const CSV_FILE_PATH = path.join(process.cwd(), '..', 'drug_data.csv');

// Mapping từ tên cột CSV sang field trong database
const FIELD_MAPPING = {
    'Thành phần': 'ingredients',
    'Công dụng': 'usage',
    'Cách dùng': 'dosage',
    'Tác dụng phụ': 'sideEffects',
    'Lưu ý': 'precautions',
    'Bảo quản': 'preservation',
    'Origin': 'origin',
    'Brand': 'brand',
    'Description': 'productDesc'
};

async function connectDB() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Kết nối MongoDB thành công');
    } catch (error) {
        console.error('❌ Lỗi kết nối MongoDB:', error);
        process.exit(1);
    }
}

async function updateProductDetails() {
    const results = [];
    let updatedCount = 0;
    let notFoundCount = 0;
    let errorCount = 0;
    let headersPrinted = false;

    return new Promise((resolve, reject) => {
        fs.createReadStream(CSV_FILE_PATH, { encoding: 'utf8' })
            .pipe(csv({
                mapHeaders: ({ header }) => header.replace(/^\uFEFF/, '').trim() // Remove BOM and trim
            }))
            .on('data', (row) => {
                // Print headers once
                if (!headersPrinted) {
                    console.log('\n📋 Các cột trong CSV:');
                    Object.keys(row).forEach((key, i) => {
                        console.log(`  ${i + 1}. "${key}"`);
                    });
                    headersPrinted = true;
                }
                results.push(row);
            })
            .on('end', async () => {
                console.log(`\n📄 Đọc được ${results.length} sản phẩm từ CSV`);

                // Debug: In ra 3 tên sản phẩm đầu tiên từ CSV
                console.log('\n📋 Mẫu dữ liệu từ CSV (row đầu tiên):');
                if (results.length > 0) {
                    const firstRow = results[0];
                    // Try different possible column names for product name
                    const possibleNames = ['Product Name', 'ProductName', 'product_name', 'name', 'Name'];
                    let productNameKey = null;
                    for (const key of possibleNames) {
                        if (firstRow[key] !== undefined) {
                            productNameKey = key;
                            break;
                        }
                    }

                    // If still not found, try to find any key containing "name"
                    if (!productNameKey) {
                        productNameKey = Object.keys(firstRow).find(k => k.toLowerCase().includes('name'));
                    }

                    console.log(`  Cột tên sản phẩm tìm thấy: "${productNameKey}"`);
                    console.log(`  Giá trị: "${firstRow[productNameKey]}"`);

                    // Update to use correct column name
                    const PRODUCT_NAME_COL = productNameKey || 'Product Name';

                    // Debug: In ra 3 tên sản phẩm đầu tiên từ Database
                    const dbSamples = await Product.find({}).limit(3).select('productName');
                    console.log('\n📋 Mẫu tên sản phẩm từ Database:');
                    if (dbSamples.length === 0) {
                        console.log('  ⚠️ Database không có sản phẩm nào!');
                    } else {
                        dbSamples.forEach((p, i) => {
                            console.log(`  ${i + 1}. "${p.productName}"`);
                        });
                    }

                    // Đếm tổng sản phẩm trong DB
                    const totalInDB = await Product.countDocuments();
                    console.log(`\n📊 Tổng sản phẩm trong Database: ${totalInDB}`);

                    console.log('\n🔄 Bắt đầu cập nhật...\n');

                    for (const row of results) {
                        const productName = row[PRODUCT_NAME_COL];
                        if (!productName || productName.trim() === '') continue;

                        try {
                            // Tìm sản phẩm theo tên (exact match)
                            let product = await Product.findOne({ productName: productName.trim() });

                            // Nếu không tìm thấy, thử tìm bằng regex (case-insensitive)
                            if (!product) {
                                const escapedName = productName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                product = await Product.findOne({
                                    productName: { $regex: new RegExp(`^${escapedName}$`, 'i') }
                                });
                            }

                            if (!product) {
                                notFoundCount++;
                                if (notFoundCount <= 5) {
                                    console.log(`  ⚠️ Không tìm thấy: "${productName.substring(0, 60)}..."`);
                                }
                                continue;
                            }

                            // Build update object
                            const updateData = {};
                            for (const [csvCol, dbField] of Object.entries(FIELD_MAPPING)) {
                                const value = row[csvCol];
                                if (value && value.trim() !== '') {
                                    updateData[dbField] = value.trim();
                                }
                            }

                            // Chỉ update nếu có dữ liệu mới
                            if (Object.keys(updateData).length > 0) {
                                await Product.updateOne(
                                    { _id: product._id },
                                    { $set: updateData }
                                );
                                updatedCount++;

                                if (updatedCount % 100 === 0) {
                                    console.log(`  ⏳ Đã cập nhật ${updatedCount} sản phẩm...`);
                                }
                            }
                        } catch (err) {
                            errorCount++;
                            console.error(`  ❌ Lỗi cập nhật "${productName}":`, err.message);
                        }
                    }
                }

                console.log('\n========== KẾT QUẢ ==========');
                console.log(`✅ Đã cập nhật: ${updatedCount} sản phẩm`);
                console.log(`⚠️ Không tìm thấy: ${notFoundCount} sản phẩm`);
                console.log(`❌ Lỗi: ${errorCount} sản phẩm`);
                console.log('==============================\n');

                resolve();
            })
            .on('error', (err) => {
                console.error('❌ Lỗi đọc file CSV:', err);
                reject(err);
            });
    });
}

async function main() {
    await connectDB();
    await updateProductDetails();
    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối MongoDB');
    process.exit(0);
}

main().catch(console.error);
