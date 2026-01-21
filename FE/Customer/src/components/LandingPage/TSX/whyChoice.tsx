import { useRef, useState } from "react";
import styles from "../CSS/WhyChoice.module.css";

export const WhyChoice = () => {
  const slideRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Số lượng box hiển thị cùng lúc
  const boxesPerView = 2;
  // Tổng số box (không tính box trùng lặp)
  const totalBoxes = 4;

  // Kích thước 1 box + margin
  const boxWidth = 620; // 600px width + 20px margin (10px mỗi bên)

  const handleNext = () => {
    if (currentIndex < totalBoxes - boxesPerView) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      if (slideRef.current) {
        slideRef.current.style.transform = `translateX(-${
          newIndex * boxWidth
        }px)`;
      }
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      if (slideRef.current) {
        slideRef.current.style.transform = `translateX(-${
          newIndex * boxWidth
        }px)`;
      }
    }
  };

  return (
    <>
      <section
        className={styles["why-choice-container"]}
        id="why-choice-container"
      >
        <h1>
          <span style={{ color: "#2b9474" }}>Medicare</span>{" "}
          <span style={{ color: "gray" }}>Service</span>
        </h1>
        <section className={styles["why-choice-wrapper"]}>
          <div className={styles["why-choice"]}>
            <div className={styles["why-choice-slide"]} ref={slideRef}>
              <div className={`${styles.box} ${styles.support}`}>
                <img src="/images/support.png" alt="Support" />
                <p>24/7 Support</p>
              </div>
              <div className={styles["doctor-background-img"]}>
                <div className={`${styles.box} ${styles.doctor}`}>
                  <img src="/images/doctor.png" alt="Doctor" />
                  <p>Expert Doctors</p>
                </div>
              </div>
              <div className={`${styles.box} ${styles.medicine}`}>
                <img src="/images/medicine.png" alt="Medicine" />
                <p>Quality Medicine</p>
              </div>
              <div className={`${styles.box} ${styles.delivery}`}>
                <img src="/images/delivery.png" alt="Delivery" />
                <p>Fast Delivery</p>
              </div>
            </div>
          </div>
          <button
            className={`${styles["carousel-btn"]} ${styles["prev-btn"]}`}
            onClick={handlePrev}
            disabled={currentIndex === 0}
            style={{ opacity: currentIndex === 0 ? 0.5 : 1 }}
          >
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <button
            className={`${styles["carousel-btn"]} ${styles["next-btn"]}`}
            onClick={handleNext}
            disabled={currentIndex >= totalBoxes - boxesPerView}
            style={{
              opacity: currentIndex >= totalBoxes - boxesPerView ? 0.5 : 1,
            }}
          >
            <i className="fa-solid fa-arrow-right"></i>
          </button>
        </section>
      </section>
    </>
  );
};
