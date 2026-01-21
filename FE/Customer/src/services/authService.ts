import axios from 'axios';

const API_URL = 'http://localhost:3000/api/auth';

interface SignupData {
  userName: string;
  passWord: string;
  email: string;
  DoB: string;
  phoneNum: string;
}

interface LoginData {
  email: string;
  passWord: string;
}

interface ResetPasswordData {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

export const authService = {
  // Đăng ký tài khoản
  signup: async (data: SignupData) => {
    return await axios.post(`${API_URL}/register`, data);
  },

  // Đăng nhập
  login: async (data: LoginData) => {
    return await axios.post(`${API_URL}/login`, data);
  },

  // Yêu cầu OTP để reset password
  forgotPassword: async (email: string) => {
    return await axios.post(`${API_URL}/forgot-password`, { email });
  },

  // Reset password với OTP
  resetPassword: async (data: ResetPasswordData) => {
    return await axios.post(`${API_URL}/reset-password`, data);
  },
};
