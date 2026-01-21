import React, { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ChangePass.module.css";
import axios from "axios";
import { toast } from "react-toastify";

const ChangePassword = () => {
  const navigate = useNavigate();
  
  // State lưu trữ dữ liệu form
  const [formData, setFormData] = useState({
    email: "",
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // State cho thông báo lỗi
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Xử lý khi người dùng nhập liệu
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Xóa thông báo lỗi khi người dùng bắt đầu nhập lại
    if (error) setError(null);
  };

  // Xử lý khi submit form
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { email, oldPassword, newPassword, confirmPassword } = formData;

    // 1. Kiểm tra điền đầy đủ thông tin
    if (!email || !oldPassword || !newPassword || !confirmPassword) {
      setError("Vui lòng điền đầy đủ tất cả các trường.");
      return;
    }

    // 2. Kiểm tra mật khẩu mới trùng với xác nhận mật khẩu
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu mới và xác nhận mật khẩu không khớp.");
      return;
    }

    // 3. Kiểm tra mật khẩu mới không được trùng mật khẩu cũ (tùy chọn)
    if (newPassword === oldPassword) {
      setError("Mật khẩu mới không được trùng với mật khẩu cũ.");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:3000/api/auth/change-password",
        {
          email,
          oldPassword,
          newPassword,
          confirmPassword,
        },
      );

      toast.success(response.data.message);
      // Reset form
      setFormData({
        email: "",
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setLoading(false);
      
      // Tự động chuyển về trang chủ sau 1.5 giây
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error: any) {
      setLoading(false);
      if (error.response) {
        setError(error.response.data.message);
      } else {
        setError("Có lỗi xảy ra. Vui lòng thử lại.");
      }
    }
  };

  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        <img src="public\images\logo.png" alt="" />
        <h2 className={styles.title}>Đổi Mật Khẩu</h2>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Email */}
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={styles.input}
              placeholder="Nhập email của bạn"
            />
          </div>

          {/* Mật khẩu cũ */}
          <div className={styles.inputGroup}>
            <label htmlFor="oldPassword" className={styles.label}>
              Mật khẩu cũ
            </label>
            <input
              type="password"
              id="oldPassword"
              name="oldPassword"
              value={formData.oldPassword}
              onChange={handleChange}
              className={styles.input}
              placeholder="••••••••"
            />
          </div>

          {/* Mật khẩu mới */}
          <div className={styles.inputGroup}>
            <label htmlFor="newPassword" className={styles.label}>
              Mật khẩu mới
            </label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              className={styles.input}
              placeholder="••••••••"
            />
          </div>

          {/* Xác nhận mật khẩu mới */}
          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={styles.input}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default ChangePassword;
