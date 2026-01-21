import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { User } from '../models/auth/User.js';

dotenv.config();

const phone = process.argv[2] || '0999999999';
const newPassword = '123456';

const resetPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const hash = await bcrypt.hash(newPassword, 10);
        const result = await User.updateOne(
            { $or: [{ phoneNum: phone }, { email: phone }, { userName: phone }] },
            { passWord: hash }
        );

        if (result.modifiedCount > 0) {
            console.log(`✅ Đã reset mật khẩu cho ${phone} thành: ${newPassword}`);
        } else {
            console.log('❌ Không tìm thấy user hoặc mật khẩu không thay đổi');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

resetPassword();
