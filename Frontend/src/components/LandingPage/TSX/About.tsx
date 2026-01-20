import styles from "../CSS/About.module.css";

const activities = [
  {
    icon: "/images/tuvankh.webp",
    title: "Tư Vấn Khách Hàng",
    description:
      "Đội ngũ dược sĩ chuyên nghiệp tư vấn tận tình cho từng khách hàng",
  },
  {
    icon: "/images/daotaonv.jpg",
    title: "Đào Tạo Nhân Viên",
    description: "Chương trình đào tạo liên tục nâng cao chuyên môn nghiệp vụ",
  },
  {
    icon: "/images/thiennguyen.png",
    title: "Hoạt Động Thiện Nguyện",
    description:
      "Tham gia các hoạt động cộng đồng, hỗ trợ người có hoàn cảnh khó khăn",
  },
  {
    icon: "/images/sukien.png",
    title: "Sự Kiện Sức Khỏe",
    description: "Tổ chức các buổi tư vấn sức khỏe miễn phí cho cộng đồng",
  },
  {
    icon: "/images/award.png",
    title: "Nhận Giải Thưởng",
    description: "Vinh dự nhận nhiều giải thưởng uy tín trong ngành dược phẩm",
  },
  {
    icon: "/images/chinhanh.jpg",
    title: "Mở Rộng Chi Nhánh",
    description: "Liên tục phát triển mạng lưới nhà thuốc trên toàn quốc",
  },
];

export const About = () => {
  return (
    <section className={styles.section} id="activities">
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Hoạt Động Nhà Thuốc</h2>
          <p className={styles.subtitle}>
            Những hình ảnh về hoạt động và sự phát triển của chúng tôi
          </p>
        </div>

        <div className={styles.grid}>
          {activities.map((activity, index) => (
            <div key={index} className={styles.card}>
              <div className={styles.cardImage}>
                <img
                  src={activity.icon}
                  alt=""
                  style={{
                    objectFit: "cover", // Changed to cover for better photo display
                    width: "100%",
                    height: "100%",
                  }}
                />
              </div>
              <div className={styles.overlay}>
                <h3 className={styles.cardTitle}>{activity.title}</h3>
                <p className={styles.cardDesc}>{activity.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
