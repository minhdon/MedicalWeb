/**
 * Seed OrderStatus collection with all required statuses
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { OrderStatus } from '../models/saleInvoice/OrderStatus.js';

const MONGO_URI = process.env.MONGO_URI;

const statuses = ['Pending', 'Confirmed', 'Processing', 'Completed', 'Cancelled'];

async function seedOrderStatuses() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        for (const statusName of statuses) {
            const existing = await OrderStatus.findOne({ statusName });
            if (!existing) {
                await OrderStatus.create({ statusName });
                console.log(`Created: ${statusName}`);
            } else {
                console.log(`Already exists: ${statusName}`);
            }
        }

        console.log('Seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding OrderStatus:', error);
        process.exit(1);
    }
}

seedOrderStatuses();
