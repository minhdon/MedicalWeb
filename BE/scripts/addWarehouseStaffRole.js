import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Role } from '../models/auth/Role.js';

dotenv.config();

const addWarehouseStaffRole = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Check if WarehouseStaff role exists
        const existing = await Role.findOne({ roleName: 'WarehouseStaff' });

        if (!existing) {
            await Role.create({
                roleName: 'WarehouseStaff',
                description: 'Nhân viên quản lý kho - có thể truy cập Admin panel với quyền hạn giới hạn'
            });
            console.log('✅ Created WarehouseStaff role');
        } else {
            console.log('ℹ️ WarehouseStaff role already exists');
        }

        // List all roles
        const allRoles = await Role.find({});
        console.log('\n=== TẤT CẢ VAI TRÒ ===');
        allRoles.forEach(r => {
            console.log(`  - ${r.roleName}: ${r.description || 'N/A'}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

addWarehouseStaffRole();
