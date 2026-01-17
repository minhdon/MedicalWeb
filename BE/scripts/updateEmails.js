import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/auth/User.js';

dotenv.config();

const updateEmails = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Update admin email
        const adminResult = await User.updateOne(
            { userName: 'admin' },
            { $set: { email: 'admin@pharmacare.com' } }
        );
        console.log('Admin email updated:', adminResult.modifiedCount > 0 ? '✅ Success' : '⚠️ Not found or already updated');

        // Update staff email
        const staffResult = await User.updateOne(
            { userName: 'st' },
            { $set: { email: 'staff@pharmacare.com' } }
        );
        console.log('Staff email updated:', staffResult.modifiedCount > 0 ? '✅ Success' : '⚠️ Not found or already updated');

        console.log('\n📋 New login credentials:');
        console.log('  Admin: admin@pharmacare.com / 123456');
        console.log('  Staff: staff@pharmacare.com / 123456');

        await mongoose.disconnect();
        console.log('\n✅ Done!');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

updateEmails();
