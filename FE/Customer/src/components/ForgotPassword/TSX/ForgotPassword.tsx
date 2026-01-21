import { useState, type FormEvent } from "react";
import styles from "../CSS/ForgotPassword.module.css";
import { authService } from "../../../services/authService";

export const ForgotPassword = () => {
  const [check, setCheck] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  
  const isValidEmail = (email: string): boolean => {
    // Regex tiêu chuẩn cho email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailRegex.test(email);
  };
  const handleSetCheck = (value: string) => {
    setEmail(value);
    if (isValidEmail(value) == true) setCheck(true);
    else setCheck(false);
    if (error) setError(null);
    return;
  };
  const handleToConfirmOtp = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!check) {
      setError("Email không hợp lệ");
      return;
    }
    
    try {
      const response = await authService.forgotPassword(email);
      setSuccess(response.data.message);
      // Lưu email để dùng ở trang ConfirmOtp
      localStorage.setItem('resetEmail', email);
      setTimeout(() => {
        window.location.href = "/ConfirmOtp";
      }, 1500);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Lỗi yêu cầu OTP');
    }
  };
  return (
    <>
      <section className={styles.hero}>
        {error && <div className={styles.errorMessage}>{error}</div>}
        {success && <div className={styles.successMessage}>{success}</div>}
        <div className={styles.container}>
          <div className={styles.card}>
            <h2 className={styles["card-title"]}>Quên Mật Khẩu?</h2>

            <p className={styles["card-description"]}>
              Đừng lo lắng! Chỉ cần nhập email của bạn bên dưới và chúng tôi sẽ
              gửi cho bạn một liên kết để đặt lại mật khẩu.
            </p>

            <form action="#" method="POST">
              <div className={styles["form-group"]}>
                <label htmlFor="email" className={styles["form-label"]}>
                  Địa chỉ Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  placeholder="ban@example.com"
                  className={styles["form-input"]}
                  onChange={(e) => handleSetCheck(e.target.value)}
                />
              </div>

              <div className={styles["button-container"]}>
                <button
                  id="submit-button"
                  className={styles["submit-button"]}
                  onClick={handleToConfirmOtp}
                >
                  Gửi liên kết đặt lại
                </button>
              </div>
            </form>

            <div className={styles["login-link-container"]}>
              <a href="/login" className={styles["login-link"]}>
                Quay lại Đăng nhập
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
