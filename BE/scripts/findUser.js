import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/auth/User.js';
import { Role } from '../models/auth/Role.js';

dotenv.config();

const phone = process.argv[2] || '0999999999';

const findUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const user = await User.findOne({
            $or: [
                { phoneNum: phone },
                { email: phone },
                { userName: phone }
            ]
        }).populate('roleId', 'roleName');

        if (user) {
            console.log('✅ TÌM THẤY:');
            console.log('   Email:', user.email);
            console.log('   Phone:', user.phoneNum);
            console.log('   UserName:', user.userName);
            console.log('   FullName:', user.fullName);
            console.log('   Role:', user.roleId?.roleName);
        } else {
            console.log('❌ KHÔNG TÌM THẤY user với phone/email:', phone);
            console.log('   Vui lòng tạo khách hàng mới hoặc sử dụng số điện thoại đã đăng ký.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

findUser();
