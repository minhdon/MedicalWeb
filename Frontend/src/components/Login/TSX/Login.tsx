// styles được import và SỬ DỤNG trong code bên dưới
import { useState } from "react";
import styles from "../CSS/Login.module.css";
import { authService } from "../../../services/authService";
import { useAuth } from "../../../contexts/AuthContext";

export const Login = () => {
  const [hiddenPassword, setHiddenPassword] = useState(true);
  const [message, setMessage] = useState<string>("");
  const [isError, setIsError] = useState(false);
  const { login } = useAuth();

  const actionUnHiddenPassword = () => {
    setHiddenPassword(false);
  };
  const actionHiddenPassword = () => {
    setHiddenPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem('emailLog') as HTMLInputElement).value;
    const passWord = (form.elements.namedItem('passwordLog') as HTMLInputElement).value;

    try {
      const response = await authService.login({ email, passWord });
      setMessage(response.data.message);
      setIsError(false);

      // Store full user data including role and warehouse via AuthContext
      const userData = response.data.user;
      const token = response.data.token;
      login(userData, token);

      console.log('Logged in as:', userData.role, userData.warehouse?.name || 'N/A');

      // Redirect sau 1 giây
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Lỗi đăng nhập');
      setIsError(true);
    }
  };

  const unHidden = hiddenPassword ? "" : styles.unhidden;
  const Hidden = hiddenPassword ? "" : styles.hidden;
  const typePassword = hiddenPassword ? "password" : "text";
  return (
    <>
      <section className={styles.root}>
        <section className={styles.image}>
          <img src="/images/bgLogin.png" alt="" />
        </section>
        <section className={styles.hero}>
          <div className={styles.logo}>
            <img src="/images/logo.png" alt="Medicare Logo" />
          </div>
          <div className={styles.wrapper}>
            <div
              className={`${styles["form-box"]} ${styles.login}`}
              id="login-box"
            >
              <h2>Login</h2>
              <p className={styles["first-p"]}>
                Login to your account <a href="/">Medicare</a>
              </p>
              {message && (
                <div style={{
                  padding: '10px',
                  marginBottom: '10px',
                  borderRadius: '5px',
                  backgroundColor: isError ? '#fee' : '#efe',
                  color: isError ? '#c00' : '#0a0',
                  textAlign: 'center'
                }}>
                  {message}
                </div>
              )}
              <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles["input-box"]}>
                  <span className={styles.icon}>
                    <i className="fa-solid fa-envelope"></i>
                  </span>
                  <input type="text" id="emailLog" required />

                  <label htmlFor="emailLog">Email</label>
                </div>

                <div className={styles["input-box"]}>
                  <span className={styles.icon}>
                    <i
                      className={`fa-solid fa-eye ${styles["fa-eye"]} ${unHidden}`}
                      id="eye"
                      onClick={actionHiddenPassword}
                    ></i>

                    <i
                      className={`fa-solid fa-eye-slash ${styles["fa-eye-slash"]} ${Hidden}  `}
                      id="eye-slash"
                      onClick={actionUnHiddenPassword}
                    ></i>
                  </span>
                  <input type={typePassword} id="passwordLog" required />

                  <label htmlFor="passwordLog">Password</label>
                </div>

                <div className={styles["remember-forgot"]}>
                  <a href="/ForgotPassword">Forgot Password?</a>
                  <a href="/ChangePass">Change Password?</a>
                </div>

                <button type="submit" className={styles.btn} id="btnLogin">
                  Login
                </button>

                <div className={styles["login-register"]}>
                  <p>
                    Don't have an account?
                    <a
                      href="/register"
                      className={styles["register-link"]}
                      id="register-link"
                    >
                      Register
                    </a>
                  </p>
                </div>

                <div className={styles.line}>
                  <div className={styles["child-line"]}></div>
                  <p>OR</p>
                  <div className={styles["child-line"]}></div>
                </div>

                <button className={`${styles.btn} ${styles.google}`}>
                  <img src="/images/google.webp" alt="Google logo" />
                  <span>Login with Google</span>
                </button>
              </form>
            </div>
          </div>
        </section>
      </section>
    </>
  );
};
