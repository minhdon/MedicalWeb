import styles from "../CSS/Hero.module.css";

export const Hero = () => {
  return (
    <section className={styles.hero}>
      <div className={styles.content}>
        <div className={styles.logo}>
          <img src="/images/logo.png" alt="" />
        </div>
        <h1 className={styles.brandName}>Nhà Thuốc Medicare</h1>
        <p className={styles.slogan}>
          Sức khỏe của bạn - Sứ mệnh của chúng tôi
        </p>
        <div className={styles.buttons}>
          <button
            className={styles.primaryBtn}
            onClick={() => {
              window.location.href = "/product";
            }}
          >
            Khám phá sản phẩm
          </button>
          <button
            className={styles.secondaryBtn}
            onClick={() => {
              window.location.href = "/contact";
            }}
          >
            Liên hệ tư vấn
          </button>
        </div>
      </div>
    </section>
  );
};
