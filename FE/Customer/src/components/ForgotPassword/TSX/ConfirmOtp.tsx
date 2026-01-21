import React, {
  useState,
  useRef,
  useEffect,
  type KeyboardEvent,
  type ClipboardEvent,
} from "react";
import styles from "../CSS/Otp.module.css";
import { authService } from "../../../services/authService";

interface OtpVerificationProps {
  email?: string;
  otpLength?: number;
  onVerify?: (code: string) => void;
  onResend?: () => void;
}

const OtpVerification: React.FC<OtpVerificationProps> = ({
  email: propEmail,
  otpLength = 6,
  onVerify,
  onResend,
}) => {
  const [otp, setOtp] = useState<string[]>(new Array(otpLength).fill(""));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Lấy email từ localStorage nếu không được truyền vào
  const email = propEmail || localStorage.getItem('resetEmail') || "example@gmail.com";

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Tự động focus ô đầu tiên khi trang load
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Xử lý đếm ngược
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Xử lý khi nhập giá trị
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const value = e.target.value;
    if (isNaN(Number(value))) return; // Chỉ cho phép nhập số

    const newOtp = [...otp];
    // Lấy ký tự cuối cùng nhập vào (trường hợp người dùng gõ đè)
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Tự động chuyển focus sang ô tiếp theo nếu có giá trị
    if (value && index < otpLength - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Xử lý các phím đặc biệt (Backspace, Arrow keys)
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (
      e.key === "Backspace" &&
      !otp[index] &&
      index > 0 &&
      inputRefs.current[index - 1]
    ) {
      // Nếu ô hiện tại rỗng và nhấn Backspace, lùi về ô trước
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Xử lý dán (Paste)
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text/plain")
      .slice(0, otpLength);

    if (!/^\d+$/.test(pastedData)) return; // Chỉ chấp nhận số

    const newOtp = [...otp];
    pastedData.split("").forEach((char, i) => {
      newOtp[i] = char;
    });
    setOtp(newOtp);

    // Focus vào ô cuối cùng được điền hoặc ô tiếp theo
    const nextIndex = Math.min(pastedData.length, otpLength - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleSubmit = async () => {
    const code = otp.join("");
    if (code.length !== otpLength || !newPassword || !confirmPassword) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await authService.resetPassword({
        email,
        otp: code,
        newPassword,
        confirmPassword
      });
      
      setSuccess(response.data.message || "Đặt lại mật khẩu thành công!");
      
      // Xóa email khỏi localStorage
      localStorage.removeItem('resetEmail');
      
      setTimeout(() => {
        window.location.href = "/Login";
      }, 1500);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Lỗi xác thực OTP');
      setIsSubmitting(false);
    }
  };

  const handleResendClick = async () => {
    if (countdown > 0) return;
    
    try {
      await authService.forgotPassword(email);
      setCountdown(30); // Reset đếm ngược 30s
      // Xóa trắng ô nhập
      setOtp(new Array(otpLength).fill(""));
      inputRefs.current[0]?.focus();
      setError(null);
      setSuccess("Mã OTP mới đã được gửi!");
    } catch (error: any) {
      setError(error.response?.data?.message || 'Lỗi gửi lại OTP');
    }
  };

  return (
    <div className={styles.container}>
      {success && <div className={styles.successMessage}>{success}</div>}
      {error && <div className={styles.errorMessage}>{error}</div>}
      <div className={styles.card}>
        <div className={styles.iconContainer}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            width="32"
            height="32"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h3 className={styles.title}>Nhập mã xác nhận</h3>
        <p className={styles.subtitle}>
          Mã xác thực đã được gửi đến email <br />
          <span className={styles.emailHighlight}>{email}</span>
        </p>

        <div className={styles.otpGroup}>
          {otp.map((data, index) => (
            <input
              key={index}
              type="text"
              inputMode="numeric"
              maxLength={1}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              value={data}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={handlePaste}
              className={styles.otpInput}
            />
          ))}
        </div>

        <div style={{ marginTop: '20px', width: '100%' }}>
          <input
            type="password"
            placeholder="Mật khẩu mới"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '10px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
          <input
            type="password"
            placeholder="Xác nhận mật khẩu"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '10px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        </div>

        <button
          className={styles.buttonPrimary}
          onClick={handleSubmit}
          disabled={otp.join("").length !== otpLength || isSubmitting || !newPassword || !confirmPassword}
        >
          {isSubmitting ? "Đang xác thực..." : "Xác nhận và Đặt lại mật khẩu"}
        </button>

        <div className={styles.resendContainer}>
          Bạn không nhận được mã?
          <button
            className={styles.resendLink}
            onClick={handleResendClick}
            disabled={countdown > 0}
          >
            {countdown > 0 ? `Gửi lại sau ${countdown}s` : "Gửi lại mã"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OtpVerification;
