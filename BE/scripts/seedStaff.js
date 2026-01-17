import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { User } from '../models/auth/User.js';
import { Role } from '../models/auth/Role.js';
import { Warehouse } from '../models/warehouse/Warehouse.js';

dotenv.config();

const seedStaff = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Create Staff Role if not exists
        let staffRole = await Role.findOne({ roleName: 'Staff' });
        if (!staffRole) {
            staffRole = await Role.create({
                roleName: 'Staff',
                description: 'Nhân viên bán hàng tại chi nhánh'
            });
            console.log('✅ Created Staff role');
        } else {
            console.log('ℹ️ Staff role already exists');
        }

        // 2. Create Admin Role if not exists
        let adminRole = await Role.findOne({ roleName: 'Admin' });
        if (!adminRole) {
            adminRole = await Role.create({
                roleName: 'Admin',
                description: 'Quản trị viên hệ thống'
            });
            console.log('✅ Created Admin role');
        } else {
            console.log('ℹ️ Admin role already exists');
        }

        // 3. Create a sample Warehouse/Branch
        let warehouse = await Warehouse.findOne({ warehouseName: 'Chi nhánh Quận 1' });
        if (!warehouse) {
            warehouse = await Warehouse.create({
                warehouseName: 'Chi nhánh Quận 1',
                address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
                status: true
            });
            console.log('✅ Created warehouse: Chi nhánh Quận 1');
        } else {
            console.log('ℹ️ Warehouse already exists');
        }

        // 4. Create Staff User
        const existingStaff = await User.findOne({ email: 'st' });
        if (!existingStaff) {
            const hashedPassword = await bcrypt.hash('123456', 10);
            await User.create({
                fullName: 'Nhân viên Test',
                userName: 'st',
                email: 'st',
                passWord: hashedPassword,
                phoneNum: '0901234567',
                roleId: staffRole._id,
                warehouseId: warehouse._id
            });
            console.log('✅ Created staff user: st / 123456');
        } else {
            console.log('ℹ️ Staff user "st" already exists');
        }

        // 5. Create Admin User
        const existingAdmin = await User.findOne({ email: 'admin' });
        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash('123456', 10);
            await User.create({
                fullName: 'Admin',
                userName: 'admin',
                email: 'admin',
                passWord: hashedPassword,
                phoneNum: '0909999999',
                roleId: adminRole._id,
                warehouseId: null // Admin không thuộc chi nhánh cụ thể
            });
            console.log('✅ Created admin user: admin / 123456');
        } else {
            console.log('ℹ️ Admin user already exists');
        }

        console.log('\n🎉 Seed completed successfully!');
        console.log('-----------------------------------');
        console.log('Staff login: email="st", password="123456"');
        console.log('Admin login: email="admin", password="123456"');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }
};

seedStaff();
