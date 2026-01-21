import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/auth/User.js';
import { Role } from '../models/auth/Role.js';
import { Warehouse } from '../models/warehouse/Warehouse.js';

dotenv.config();

const checkDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB\n');

        // Check Warehouses
        console.log('=== WAREHOUSES (Chi nhánh) ===');
        const warehouses = await Warehouse.find({});
        if (warehouses.length === 0) {
            console.log('❌ Không có chi nhánh nào trong database!');
        } else {
            warehouses.forEach(w => console.log(`  - ${w.warehouseName} (ID: ${w._id})`));
        }

        // Check Roles
        console.log('\n=== ROLES ===');
        const roles = await Role.find({});
        roles.forEach(r => console.log(`  - ${r.roleName} (ID: ${r._id})`));

        // Check Staff/Admin Users
        console.log('\n=== TÀI KHOẢN NHÂN VIÊN/ADMIN ===');
        const staffRole = await Role.findOne({ roleName: 'Staff' });
        const adminRole = await Role.findOne({ roleName: 'Admin' });

        const staffAdminRoleIds = [staffRole?._id, adminRole?._id].filter(Boolean);

        const users = await User.find({ roleId: { $in: staffAdminRoleIds } })
            .populate('roleId', 'roleName')
            .populate('warehouseId', 'warehouseName');

        if (users.length === 0) {
            console.log('❌ Không có tài khoản nhân viên/admin nào!');
        } else {
            console.log(`Tổng: ${users.length} tài khoản\n`);
            users.forEach(u => {
                console.log(`  📧 Email: ${u.email}`);
                console.log(`     Tên: ${u.fullName}`);
                console.log(`     Role: ${u.roleId?.roleName || 'N/A'}`);
                console.log(`     Chi nhánh: ${u.warehouseId?.warehouseName || 'Không thuộc chi nhánh'}`);
                console.log('');
            });
        }

        // Check which warehouses don't have staff
        console.log('\n=== CHI NHÁNH CHƯA CÓ NHÂN VIÊN ===');
        for (const warehouse of warehouses) {
            const staffInWarehouse = await User.findOne({
                warehouseId: warehouse._id,
                roleId: staffRole?._id
            });
            if (!staffInWarehouse) {
                console.log(`  ⚠️ ${warehouse.warehouseName} - CHƯA CÓ NHÂN VIÊN`);
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

checkDatabase();
