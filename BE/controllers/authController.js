import bcrypt, { hash } from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/auth/User.js';
import { Role } from '../models/auth/Role.js';
import dotenv from 'dotenv';
import { loginSchema, resetPasswordRequestSchema, resetPasswordSchema, signUpSchema, updatePasswordSchema } from '../validators/auth/authValidator.js';
import { OTP } from '../models/auth/OTP.js';
import { generateOTP } from '../utils/otpGenerator.js';
import { sendOTPEmail } from '../utils/emailService.js';

dotenv.config();

export const registerUser = async (req, res, next) => {
    const { userName, passWord, email, address, DoB, phoneNum } = req.body;
    try {
        const { value, error } = signUpSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ 
                message: error.details[0].message 
            });
        }

        const existingUser = await User.findOne({
            $or: [{ userName }, { email }]
        });

        if (existingUser) {
            return res.status(400).json({
                message: 'Tên đăng nhập hoặc Email đã tồn tại!'
            });
        }

        const hashPassword = await bcrypt.hash(passWord, 10);
        const newUser = new User({
            userName,
            passWord: hashPassword,
            email,
            DoB,
            phoneNum
        });
        await newUser.save();

        return res.status(200).json({
            message: 'Đăng ký tài khoản thành công!',
            user: {
                userName: newUser.userName
            }
        });
    } catch(error) {
        console.error("Lỗi đăng ký tài khoản:", error);
        return next(error);
    }        
}

export const loginUser = async (req, res, next) => {
    const { userName, passWord } = req.body;
    try {
        const { value, error } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                message: error.details[0].message
            });
        }

        const user = await User.findOne({ userName });
        if (!user || !(await bcrypt.compare(passWord, user.passWord))) {
            return res.status(400).json({
                message: 'Tên đăng nhập hoặc mật khẩu không chính xác!'
            });
        }
        
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        return res.status(200).json({
            message: 'Đăng nhập thành công!',
            token
        });
    } catch(error) {
        console.error("Lỗi đăng nhập:", error);
        return next(error);
    }
}

export const resetPasswordRequest = async (req, res, next) => {
    const { email } = req.body;
    try {
        const { value, error } = resetPasswordRequestSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                message: error.details[0].message
            });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                message: 'Email không tồn tại trong hệ thống!'
            });
        }
        await OTP.deleteMany({ email });
        const otp = generateOTP();
        await OTP.create({ email, otp, createAt: new Date() });
        await sendOTPEmail(email, otp);

        return res.status(200).json({
            message: 'Mã OTP đã được gửi đến email của bạn!. Vui lòng kiểm tra hộp thư đến.'
        });
    } catch(error) {
        console.error("Lỗi yêu cầu đặt lại mật khẩu:", error);
        return next(error);
    }
}

export const resetPassword = async (req, res, next) => {
    const { email, otp, newPassword, confirmPassword } = req.body;
    try {
        const { value, error } = resetPasswordSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                message: error.details[0].message
            });
        }
        const otpRecord = await OTP.findOne({ email, otp });
        if (!otpRecord) {
            return res.status(400).json({
                message: 'Mã OTP không hợp lệ hoặc đã hết hạn!'
            });
        }
        const user = await User.findOne({ email});
        if (!user) {
            return res.status(400).json({
                message: 'Người dùng không tồn tại!'
            });
        }

        const hashPassword = bcrypt.hash(newPassword, 10);
        user.passWord = hashPassword;
        await user.save();

        await OTP.deleteMany({ email });

        return res.status(200).json({
            messsage: 'Đặt lại mật khẩu thành công!'
        });
    } catch(error) {
        console.error("Lỗi đặt lại mật khẩu:", error);
        return next(error);
    }
}

export const updatePassword = async (req, res, next) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    try {
        const { value, error } = updatePasswordSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                message: error.details[0].message
            });
        }
        const userId = req.user?._id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({
                message: 'Người dùng không tồn tại!'
            });
        }
        const checkOldPassword = await bcrypt.compare(oldPassword, user.passWord);
        if (!checkOldPassword) {
            return res.status(400).json({
                message: 'Mật khẩu cũ không đúng!'
            });
        }
        const compareNewOld = await bcrypt.compare(newPassword, user.passWord);
        if (compareNewOld) {
            return res.status(400).json({
                message: 'Mật khẩu mới không được trùng với mật khẩu cũ!'
            });
        }
        const hashPassword = await bcrypt.hash(newPassword, 10);
        user.passWord = hashPassword;
        await user.save();

        return res.status(200).json({
            message: 'Cập nhật mật khẩu thành công!'
        })
    } catch(error) {
        console.error("Lỗi cập nhật mật khẩu:", error);
        return next(error);
    }
}