
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from '../models/product/Product.js';

dotenv.config();

const checkProduct = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        console.log("Searching for 'Eugica'...");
        const products = await Product.find({ productName: { $regex: 'Eugica', $options: 'i' } }).limit(5);

        if (products.length === 0) {
            console.log("No products found matching 'Eugica'.");
        } else {
            console.log(`Found ${products.length} products:`);
            products.forEach(p => {
                console.log(`- ID: ${p._id}`);
                console.log(`- Name: '${p.productName}'`);
                // Inspect unicode characters
                const hex = Buffer.from(p.productName).toString('hex');
                console.log(`- Hex: ${hex}`);
            });
        }

        const count = await Product.countDocuments({});
        console.log(`Total products in DB: ${count}`);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
};

checkProduct();
