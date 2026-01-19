/**
 * Delete All Test Orders Script
 * Deletes all orders AND restores stock to batches
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { SaleInvoice } from '../models/saleInvoice/SaleInvoice.js';
import { SaleInvoiceDetail } from '../models/saleInvoice/SaleInvoiceDetail.js';
import { ProductBatch } from '../models/product/ProductBatch.js';
import { Product } from '../models/product/Product.js';
import { Warehouse } from '../models/warehouse/Warehouse.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/medical-website';

// Helper to update product stockQuantity
async function updateProductStock(productId) {
    try {
        const centralWarehouse = await Warehouse.findOne({ warehouseType: 'central' });
        const batchQuery = { productId };
        if (centralWarehouse) {
            batchQuery.warehouseId = centralWarehouse._id;
        }

        const batches = await ProductBatch.find(batchQuery);
        const stockQuantity = batches.reduce((sum, b) => sum + (b.remainingQuantity || 0), 0);

        const validBatches = batches.filter(b => b.expiryDate && b.remainingQuantity > 0);
        const sortedByExpiry = validBatches.sort((a, b) =>
            new Date(a.expiryDate) - new Date(b.expiryDate)
        );
        const nearestExpiryDate = sortedByExpiry.length > 0 ? sortedByExpiry[0].expiryDate : null;

        await Product.updateOne(
            { _id: productId },
            { $set: { stockQuantity, nearestExpiryDate } }
        );
    } catch (error) {
        console.error(`Error updating stock for ${productId}:`, error.message);
    }
}

async function deleteAllOrders() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Get all orders
        const allOrders = await SaleInvoice.find({});
        console.log(`Found ${allOrders.length} orders to delete`);

        if (allOrders.length === 0) {
            console.log('No orders to delete');
            return;
        }

        let totalRestored = 0;
        const affectedProducts = new Set();

        // Process each order
        for (const order of allOrders) {
            // Get order details
            const details = await SaleInvoiceDetail.find({ saleInvoiceId: order._id });

            // Restore stock to batches
            for (const detail of details) {
                if (detail.batchId) {
                    await ProductBatch.updateOne(
                        { _id: detail.batchId },
                        { $inc: { remainingQuantity: detail.quantity } }
                    );
                    totalRestored += detail.quantity;

                    if (detail.productId) {
                        affectedProducts.add(detail.productId.toString());
                    }
                }
            }

            // Delete order details
            await SaleInvoiceDetail.deleteMany({ saleInvoiceId: order._id });
        }

        // Delete all orders
        const result = await SaleInvoice.deleteMany({});

        // Update stockQuantity for all affected products
        console.log(`Updating stock for ${affectedProducts.size} products...`);
        for (const productId of affectedProducts) {
            await updateProductStock(productId);
        }

        console.log('\n✅ Cleanup completed!');
        console.log(`   Orders deleted: ${result.deletedCount}`);
        console.log(`   Stock restored: ${totalRestored} units`);
        console.log(`   Products updated: ${affectedProducts.size}`);

    } catch (error) {
        console.error('Cleanup failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run cleanup
deleteAllOrders();
