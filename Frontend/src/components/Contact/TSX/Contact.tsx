// Đã thêm 'styles' import trở lại
import { useState } from "react";
import styles from "../CSS/Contact.module.css";
import emailjs from "@emailjs/browser";

export const Contact = () => {
  const [isSending, setIsSending] = useState(false);
  const [paragraphContent, setParagraphContent] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");

  const handleSendEmail = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsSending(true);

    // Cấu hình params khớp với tên biến trong Template của EmailJS
    const templateParams = {
      to_email: "minhdoan@gmail.com", // Email người nhận
      message: paragraphContent, // Nội dung lấy từ đoạn văn
      name: customerName,
      email: customerEmail,
    };

    emailjs
      .send(
        "service_0vfgbb6", // Thay bằng Service ID của bạn
        "template_e09usmc", // Thay bằng Template ID của bạn
        templateParams,
        "JFE8dCy-gTgI7p4uj", // Thay bằng Public Key của bạn
      )
      .then(
        (response) => {
          console.log("SUCCESS!", response.status, response.text);
          alert("Đã gửi email thành công!");
          setIsSending(false);
        },
        (err) => {
          console.log("FAILED...", err);
          alert("Gửi thất bại, vui lòng thử lại.");
          setIsSending(false);
        },
      );
  };

  return (
    <>
      {/* Thay đổi className="section" -> className={styles.section} */}
      <section className={styles.section}>
        {/* Lớp Font Awesome này được giữ nguyên, KHÔNG dùng styles.* */}
        <i className="fa-solid fa-handshake"></i>
        <h1>CONTACT US</h1>
        {/* Thay đổi className="frame" -> className={styles.frame} */}
        <div className={styles.frame}>
          {/* Thay đổi className="input" -> className={styles.input} */}
          <div className={styles.input}>
            {/* Sử dụng dấu ngoặc vuông vì tên class có dấu gạch ngang
              Thay đổi "input-box" -> styles['input-box']
            */}
            <div className={styles["input-box"]}>
              <input
                type="text"
                id="your-name"
                placeholder=""
                required
                onChange={(e) => setCustomerName(e.target.value)}
              />
              <label htmlFor="your-name">Your Name</label>
            </div>

            <div className={styles["input-box"]}>
              <input
                type="email"
                id="email"
                placeholder=""
                required
                onChange={(e) => setCustomerEmail(e.target.value)}
              />{" "}
              <label htmlFor="email">Email</label>
            </div>

            <div className={styles["input-box"]}>
              <input
                type="text"
                id="message"
                placeholder=""
                required
                onChange={(e) => setParagraphContent(e.target.value)}
              />
              <label htmlFor="message">Message</label>
            </div>
          </div>
          <button onClick={handleSendEmail} disabled={isSending}>
            Contact us
          </button>
          {/* Thay đổi "contact-info" -> styles['contact-info'] */}
          <div className={styles["contact-info"]}>
            <h2>Contact</h2>
            <p>example@gmail.com</p>
            <h2>Based in</h2>
            <p>120 Yên Lãng, Đống Đa, Hà Nội</p>
            <img
              src="/images/120yenlang.png"
              alt="Bản đồ hoặc hình ảnh 120 Yên Lãng"
            />
          </div>
        </div>
      </section>
    </>
  );
};
