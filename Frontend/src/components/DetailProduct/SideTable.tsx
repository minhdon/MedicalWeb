import React, { useState } from "react";
import styles from "./SideTable.module.css";
import { type ApiData } from "../CallApi/CallApiProduct";

// Định nghĩa kiểu dữ liệu cho menu
interface SectionData {
    id: string;
    label: string;
    content: React.ReactNode;
}

interface SideTableProps {
    product: ApiData;
}

const SideTable: React.FC<SideTableProps> = ({ product }) => {
    const [activeTab, setActiveTab] = useState<string>("thanh-phan");

    const getCapitalizedWords = (text: string): string => {
        if (!text) return "";
        const words = text.trim().split(/\s+/);
        const wordChoices = words.slice(1).filter((word) => {
            const firstChar = word.charAt(0);
            return firstChar !== firstChar.toLowerCase();
        });
        return wordChoices.join(" ") || text.split(" ").slice(0, 3).join(" ");
    };

    // Hàm xử lý khi click menu: Scroll đến section và set active
    const handleScrollTo = (id: string) => {
        setActiveTab(id);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
    };

    // Dữ liệu các section
    const sections: SectionData[] = [
        {
            id: "thanh-phan",
            label: "Thành phần",
            content: (
                <>
                    <p className={styles.text}>
                        Thành phần cho 1 {product?.unit?.toLowerCase() || "hộp"}
                    </p>
                    <table className={styles.table}>
                        <thead>
                            <tr className={styles.tableHeader}>
                                <th>Thông tin thành phần</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className={styles.tableRow}>
                                <td>{product?.ingredients || "Đang cập nhật..."}</td>
                            </tr>
                        </tbody>
                    </table>
                </>
            ),
        },
        {
            id: "cong-dung",
            label: "Công dụng",
            content: (
                <>
                    <div className={styles.subTitle}>Chỉ định</div>
                    <p className={styles.text}>
                        {product?.usage || "Thông tin đang cập nhật..."}
                    </p>
                </>
            ),
        },
        {
            id: "cach-dung",
            label: "Cách dùng",
            content: (
                <div>
                    <div className={styles.subTitle}>Liều dùng</div>
                    <p className={styles.text}>
                        {product?.dosage || product?.usage || "Thông tin đang cập nhật..."}
                    </p>
                </div>
            ),
        },
        {
            id: "tac-dung-phu",
            label: "Tác dụng phụ",
            content: (
                <p className={styles.text}>
                    {product?.sideEffects || "Thông tin đang cập nhật..."}
                </p>
            ),
        },
        {
            id: "luu-y",
            label: "Lưu ý",
            content: (
                <p className={styles.text}>
                    {product?.precautions || "Thông tin đang cập nhật..."}
                </p>
            ),
        },
        {
            id: "bao-quan",
            label: "Bảo quản",
            content: (
                <p className={styles.text}>
                    {product?.preservation || "Thông tin đang cập nhật..."}
                </p>
            ),
        },
    ];

    return (
        <div className={styles.container}>
            {/* Sidebar Navigation */}
            <aside className={styles.sidebar}>
                <ul className={styles.menuList}>
                    {sections.map((sec) => (
                        <li
                            key={sec.id}
                            className={`${styles.menuItem} ${activeTab === sec.id ? styles.active : ""
                                }`}
                            onClick={() => handleScrollTo(sec.id)}
                        >
                            {sec.label}
                        </li>
                    ))}
                </ul>
            </aside>

            {/* Main Content Area */}
            <main className={styles.content}>
                <div className={styles.header}>
                    <h1 className={styles.titleMain}>
                        {getCapitalizedWords(product?.productName || "")} là gì?
                    </h1>
                </div>

                {sections.map((sec) => (
                    <section key={sec.id} id={sec.id} className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            {sec.label} của {getCapitalizedWords(product?.productName || "")}
                        </h2>
                        {sec.content}
                        <hr className={styles.divider} />
                    </section>
                ))}
            </main>
        </div>
    );
};

export default SideTable;
