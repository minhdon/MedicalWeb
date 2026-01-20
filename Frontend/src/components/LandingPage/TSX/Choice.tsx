import { ShieldCheck, Wallet, Truck, Stethoscope } from "lucide-react";
import styles from "../CSS/Choice.module.css";

const commitments = [
  {
    icon: ShieldCheck,
    title: "Thuốc Chính Hãng 100%",
    description:
      "Cam kết tất cả sản phẩm đều có nguồn gốc rõ ràng, nhập khẩu chính hãng từ các nhà sản xuất uy tín.",
  },
  {
    icon: Wallet,
    title: "Giá Cả Hợp Lý",
    description:
      "Chính sách giá cạnh tranh nhất thị trường, nhiều chương trình khuyến mãi hấp dẫn cho khách hàng.",
  },
  {
    icon: Truck,
    title: "Giao Hàng Nhanh 2H",
    description:
      "Dịch vụ giao hàng siêu tốc trong 2 giờ nội thành, đảm bảo thuốc đến tay bạn kịp thời.",
  },
  {
    icon: Stethoscope,
    title: "Tư Vấn Dược Sĩ",
    description:
      "Đội ngũ dược sĩ chuyên môn cao, sẵn sàng tư vấn miễn phí 24/7 về sức khỏe và cách dùng thuốc.",
  },
];

export const Choice = () => {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.title}>Cam Kết Của Chúng Tôi</h2>
        <p className={styles.subtitle}>
          Luôn đặt sức khỏe và lợi ích của khách hàng lên hàng đầu
        </p>
        <div className={styles.grid}>
          {commitments.map((item, index) => (
            <div key={index} className={styles.card}>
              <div className={styles.iconWrapper}>
                <item.icon size={32} className={styles.icon} />
              </div>
              <h3 className={styles.cardTitle}>{item.title}</h3>
              <p className={styles.cardDesc}>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
