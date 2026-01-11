import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ProductBatch } from '../models/product/ProductBatch.js';

dotenv.config();

const clearBatches = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const result = await ProductBatch.deleteMany({});
        console.log(`Deleted ${result.deletedCount} batches.`);

        // Also clearing purchase invoices if they exist separately? 
        // Assuming current logic just uses ProductBatch with a shared ID.

        process.exit(0);
    } catch (error) {
        console.error('Error clearing batches:', error);
        process.exit(1);
    }
};

clearBatches();
