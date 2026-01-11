import mongoose from 'mongoose';
import { Category } from '../models/product/Category.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://lequanglong345_db_user:1n6RlPBkotLtiv2G@cluster0.3niejyk.mongodb.net/medical-website?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        const categories = await Category.find({});
        console.log('Categories in database:');
        categories.forEach(c => {
            console.log(`  - ID: ${c._id}, Name: "${c.categoryName}"`);
        });
        process.exit(0);
    })
    .catch(err => {
        console.error('Error:', err.message);
        process.exit(1);
    });
