/**
 * Cleanup Empty Orders Script  
 * Deletes orders that have no products in SaleInvoiceDetail
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { SaleInvoice } from '../models/saleInvoice/SaleInvoice.js';
import { SaleInvoiceDetail } from '../models/saleInvoice/SaleInvoiceDetail.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/medical-website';

async function cleanupEmptyOrders() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Get all orders
        const allOrders = await SaleInvoice.find({});
        console.log(`Found ${allOrders.length} total orders`);

        let deleted = 0;
        const deletedIds = [];

        for (const order of allOrders) {
            // Count items for this order
            const itemCount = await SaleInvoiceDetail.countDocuments({
                saleInvoiceId: order._id
            });

            if (itemCount === 0) {
                // Delete this empty order
                await SaleInvoice.deleteOne({ _id: order._id });
                deleted++;
                deletedIds.push(order._id.toString().slice(-8));

                if (deleted % 10 === 0) {
                    console.log(`  Deleted ${deleted} empty orders...`);
                }
            }
        }

        console.log('\n✅ Cleanup completed!');
        console.log(`   Total orders: ${allOrders.length}`);
        console.log(`   Empty orders deleted: ${deleted}`);
        console.log(`   Remaining orders: ${allOrders.length - deleted}`);

        if (deletedIds.length > 0 && deletedIds.length <= 20) {
            console.log(`   Deleted IDs (last 8 chars): ${deletedIds.join(', ')}`);
        }

    } catch (error) {
        console.error('Cleanup failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run cleanup
cleanupEmptyOrders();
