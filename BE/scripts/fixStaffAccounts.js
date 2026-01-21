import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { User } from '../models/auth/User.js';
import { Role } from '../models/auth/Role.js';
import { Warehouse } from '../models/warehouse/Warehouse.js';

dotenv.config();

const fixStaffAccounts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB\n');

        const staffRole = await Role.findOne({ roleName: 'Staff' });
        const adminRole = await Role.findOne({ roleName: 'Admin' });

        if (!staffRole) {
            console.log('❌ Staff role not found!');
            process.exit(1);
        }

        const defaultPassword = '123456';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        // 1. Reset password for existing staff accounts
        console.log('=== RESET MẬT KHẨU TÀI KHOẢN HIỆN CÓ ===');

        const existingAccounts = [
            'staff@pharmacare.com',
            'admin@pharmacare.com',
            'staff@example.com',
            'admin@gmail.com'
        ];

        for (const email of existingAccounts) {
            const user = await User.findOne({ email });
            if (user) {
                user.passWord = hashedPassword;
                await user.save();
                console.log(`✅ Reset password cho: ${email} -> 123456`);
            }
        }

        // 2. Create staff for warehouses that don't have any
        console.log('\n=== TẠO NHÂN VIÊN CHO CHI NHÁNH CHƯA CÓ ===');

        const warehouses = await Warehouse.find({});

        for (const warehouse of warehouses) {
            const existingStaff = await User.findOne({
                warehouseId: warehouse._id,
                roleId: staffRole._id
            });

            if (!existingStaff) {
                // Create staff for this warehouse
                const warehouseSlug = warehouse.warehouseName
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, '')
                    .substring(0, 10);

                const staffEmail = `staff_${warehouseSlug}@pharmacare.com`;

                // Check if email already exists
                const emailExists = await User.findOne({ email: staffEmail });
                if (emailExists) {
                    console.log(`ℹ️ Email ${staffEmail} đã tồn tại, bỏ qua`);
                    continue;
                }

                await User.create({
                    fullName: `Nhân viên ${warehouse.warehouseName}`,
                    userName: staffEmail,
                    email: staffEmail,
                    passWord: hashedPassword,
                    phoneNum: '0900000000',
                    roleId: staffRole._id,
                    warehouseId: warehouse._id,
                    isActive: true
                });
                console.log(`✅ Tạo nhân viên: ${staffEmail} cho ${warehouse.warehouseName}`);
            } else {
                console.log(`ℹ️ ${warehouse.warehouseName} đã có nhân viên: ${existingStaff.email}`);
            }
        }

        console.log('\n🎉 Hoàn tất!');
        console.log('-----------------------------------');
        console.log('Tất cả tài khoản có mật khẩu: 123456');
        console.log('-----------------------------------');

        // List all staff accounts
        console.log('\n=== DANH SÁCH TÀI KHOẢN ĐĂNG NHẬP ===');
        const allStaff = await User.find({
            roleId: { $in: [staffRole._id, adminRole._id] }
        }).populate('roleId warehouseId');

        allStaff.forEach(u => {
            console.log(`Email: ${u.email} | Role: ${u.roleId?.roleName} | Chi nhánh: ${u.warehouseId?.warehouseName || 'N/A'}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

fixStaffAccounts();
