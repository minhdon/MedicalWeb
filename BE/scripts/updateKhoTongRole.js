import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/auth/User.js';
import { Role } from '../models/auth/Role.js';

dotenv.config();

const updateKhoTongStaffRole = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find WarehouseStaff role
        const warehouseStaffRole = await Role.findOne({ roleName: 'WarehouseStaff' });
        if (!warehouseStaffRole) {
            console.log('❌ WarehouseStaff role not found!');
            process.exit(1);
        }

        // Update staff_khotng account
        const result = await User.findOneAndUpdate(
            { email: 'staff_khotng@pharmacare.com' },
            { roleId: warehouseStaffRole._id },
            { new: true }
        ).populate('roleId', 'roleName');

        if (result) {
            console.log('✅ Updated account:');
            console.log(`   Email: ${result.email}`);
            console.log(`   New Role: ${result.roleId?.roleName}`);
        } else {
            console.log('❌ Account staff_khotng@pharmacare.com not found');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

updateKhoTongStaffRole();
