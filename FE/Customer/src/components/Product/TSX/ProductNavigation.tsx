import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import styles from "../CSS/ProductNavigation.module.css";

export const ProductNavigation = () => {
  const [activeTab, setActiveTab] = useState(0);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const tabs = [
    { label: "Tất cả sản phẩm", filter: "" },
    { label: "Thuốc theo đơn", filter: "prescription" },
    { label: "Thuốc không theo đơn", filter: "otc" },
  ];

  // Sync active tab with URL
  useEffect(() => {
    const currentFilter = searchParams.get("filter") || "";
    const index = tabs.findIndex(t => t.filter === currentFilter);
    setActiveTab(index >= 0 ? index : 0);
  }, [searchParams]);

  const handleTabClick = (index: number, filter: string, event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setActiveTab(index);
    if (filter) {
      navigate(`/product?filter=${filter}`);
    } else {
      navigate(`/product`);
    }
  };

  return (
    <>
      <section className={styles.hero}>
        <nav className={styles["category-tabs"]}>
          {tabs.map((tab, index) => (
            <a
              key={index}
              href="#"
              className={`${styles.tab} ${activeTab === index ? styles.active : ""}`}
              onClick={(e) => handleTabClick(index, tab.filter, e)}
            >
              {tab.label}
            </a>
          ))}
        </nav>
      </section>
    </>
  );
};
