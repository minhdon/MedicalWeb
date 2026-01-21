import styles from "../CSS/Footer.module.css";

export const Footer = () => {
  const linkToMap = () => {
    window.location.href =
      "https://www.google.com/maps/place/120+P.Y%C3%AAn+L%C3%A3ng,+Th%E1%BB%8Bnh+Quang,+%C4%90%E1%BB%91ng+%C4%90a,+H%C3%A0+N%E1%BB%99i+100000,+Vietnam/@21.0101303,105.8127533,17z/data=!3m1!4b1!4m6!3m5!1s0x313";
  };
  return (
    <>
      <section className={styles.footer}>
        <div className={styles["footer-logo"]}>
          {" "}
          <img src="/images/logo.png" alt="Medicare Logo" />
        </div>
        <div className={styles["footer-contact"]}>
          <h1>Medicare-Lựa chọn số một </h1>

          <p className={styles["footer-location"]} onClick={linkToMap}>
            <i className="fa-solid fa-location-dot"></i>120 Yên Lãng, Đống Đa,
            Hà Nội
          </p>
          <p>
            <i className="fa-solid fa-phone"></i>0123-456-789
          </p>
          <p>
            <i className="fa-solid fa-envelope"></i>example@gmail.com
          </p>
          <div className={styles.line}></div>
          <div className={styles.platform}>
            <i className="fa-brands fa-facebook-f"></i>
            <i className="fa-brands fa-youtube"></i>
            <i className="fa-brands fa-tiktok"></i>
            <i className="fa-brands fa-instagram"></i>
          </div>
        </div>
        <div className={styles["footer-something"]}>
          <div className={styles["about-us"]}>
            <h1>Về chúng tôi</h1>
            <a href="#hero">Trang chủ</a>
            <a href="#about">Tổng quan</a>
            <a href="#why-choice-container">Hoạt động thường ngày</a>
            <a href="#certification">Chứng nhận GPP</a>
          </div>

          <div className={styles["contact-us"]}>
            <h1>Liên hệ</h1>
            <a href="/contact">Liên hệ ngay</a>
          </div>
          <div className={styles.product}>
            <h1>Sản phẩm</h1>

            <a href="#">Thuốc theo đơn</a>
            <a href="#">Thuốc không theo đơn</a>
            <a href="#">Thực phẩm chức năng</a>
            <a href="#">Sản phẩm bán chạy</a>
          </div>
        </div>
      </section>
    </>
  );
};
