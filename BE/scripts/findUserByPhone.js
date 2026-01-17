// Script to find user by phone number
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/auth/User.js';
import { Role } from '../models/auth/Role.js';

dotenv.config();

const findUserByPhone = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const phone = '0768843039'; // The problematic phone number

        // Find all users with this phone
        const users = await User.find({
            $or: [
                { userName: phone },
                { phoneNum: phone }
            ]
        }).populate('roleId', 'roleName');

        console.log(`\n=== Found ${users.length} user(s) with phone ${phone} ===\n`);

        for (const user of users) {
            console.log('User ID:', user._id);
            console.log('Full Name:', user.fullName || 'UNDEFINED');
            console.log('userName:', user.userName);
            console.log('phoneNum:', user.phoneNum);
            console.log('email:', user.email);
            console.log('roleId:', user.roleId?._id || user.roleId);
            console.log('roleName:', user.roleId?.roleName || 'NO ROLE');
            console.log('---');
        }

        if (users.length > 0) {
            console.log('\n⚠️ Để xóa user này, chạy script với tham số --delete');

            // Check if --delete flag is passed
            if (process.argv.includes('--delete')) {
                for (const user of users) {
                    await User.findByIdAndDelete(user._id);
                    console.log(`✅ Đã xóa user: ${user._id}`);
                }
            }
        }

    } catch (error) {
        console.error('Lỗi:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

findUserByPhone();
