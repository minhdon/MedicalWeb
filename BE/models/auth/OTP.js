import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true,
    index: true
  },
  otp: { 
    type: String, 
    required: true 
  },
  createAt: { 
    type: Date, 
    default: Date.now,
    expires: 300 // OTP sẽ tự động xóa sau 5 phút (300 giây)
  }
});

export const OTP = mongoose.model('OTP', otpSchema);
