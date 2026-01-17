// Script to clear all Customer users from database
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/auth/User.js';
import { Role } from '../models/auth/Role.js';

dotenv.config();

const clearCustomers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find Customer role
        const customerRole = await Role.findOne({ roleName: 'Customer' });

        if (customerRole) {
            // Delete all users with Customer role
            const result = await User.deleteMany({ roleId: customerRole._id });
            console.log(`Đã xóa ${result.deletedCount} khách hàng`);
        } else {
            console.log('Không tìm thấy role Customer');
        }

        // Also delete users with no valid role (orphaned users)
        const orphanedResult = await User.deleteMany({
            roleId: null,
            // Don't delete users that might be admin/staff by checking common patterns
            fullName: { $not: /admin|staff/i }
        });
        console.log(`Đã xóa ${orphanedResult.deletedCount} user không có role`);

        // Clean up users with undefined roleId
        const undefinedResult = await User.deleteMany({
            $or: [
                { roleId: { $exists: false } },
                { roleId: null }
            ]
        });
        console.log(`Đã xóa thêm ${undefinedResult.deletedCount} user không hợp lệ`);

        console.log('✅ Hoàn tất clear customers!');
    } catch (error) {
        console.error('Lỗi:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

clearCustomers();
