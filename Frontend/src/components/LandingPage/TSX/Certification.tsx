import { Award, CheckCircle } from 'lucide-react';
import styles from "../CSS/Certification.module.css";

const standards = [
  'Cơ sở vật chất đạt tiêu chuẩn về diện tích, ánh sáng, nhiệt độ và độ ẩm',
  'Trang thiết bị bảo quản thuốc hiện đại, đúng quy cách',
  'Nhân sự có trình độ chuyên môn cao, được đào tạo bài bản',
  'Quy trình mua bán, bảo quản và tư vấn thuốc theo đúng quy định',
  'Hệ thống quản lý chất lượng và truy xuất nguồn gốc thuốc'
];

export const Certification = () => {
  return (
    <section className={styles.section} id="certification">
      <div className={styles.container}>
        <div className={styles.imageWrapper}>
          <div className={styles.badge}>
            <Award size={60} className={styles.badgeIcon} />
            <span className={styles.badgeText}>GPP</span>
            <span className={styles.badgeSubtext}>Thực Hành Tốt Nhà Thuốc</span>
          </div>
        </div>

        <div className={styles.content}>
          <h2 className={styles.title}>Chứng Nhận GPP</h2>
          <p className={styles.description}>
            GPP (Good Pharmacy Practice) là tiêu chuẩn Thực hành tốt nhà thuốc do Bộ Y tế ban hành.
            Đây là chứng nhận uy tín đảm bảo nhà thuốc đáp ứng đầy đủ các tiêu chuẩn về cơ sở vật chất,
            trang thiết bị, nhân sự và quy trình hoạt động.
          </p>

          <ul className={styles.standards}>
            {standards.map((standard, index) => (
              <li key={index} className={styles.standardItem}>
                <CheckCircle size={20} className={styles.checkIcon} />
                <span className={styles.standardText}>{standard}</span>
              </li>
            ))}
          </ul>

          <div className={styles.year}>
            <span className={styles.yearLabel}>Năm đạt chứng nhận: </span>
            <span className={styles.yearValue}>2020</span>
          </div>
        </div>
      </div>
    </section>
  );
};
