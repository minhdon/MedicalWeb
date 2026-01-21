import React, { useState } from "react";
import styles from "./Sidebar.module.css";
import { useLocation } from "react-router";
import { useNavigate } from "react-router";
import { useAuth } from "../../../contexts/AuthContext";
import { toast } from "react-toastify";
// --- Icons Inline ---
const UserIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const BagIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);
const LogoutIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const ChevronLeft = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const ChevronRight = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

interface AppLayoutProps {
  children: React.ReactNode; // Nội dung trang (ví dụ: CustomerInfo)
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  // State quản lý đóng mở (mặc định là mở như hình)
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const { pathname } = useLocation(); // Ví dụ: /admin/products/edit

  // Logic: "Lấy tất cả những gì sau dấu / thứ 2"
  const subPath = pathname.split("/").slice(2).join("/");
  // -> Kết quả: "products/edit"

  const [activeItem] = useState(subPath || "info");

  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Đăng xuất thành công!");
    setTimeout(() => {
      navigate("/");
      localStorage.removeItem("shoppingCart");
      localStorage.removeItem("buyNowCart");
    }, 2000); // Chờ 2 giây để toast hiển thị
  };

  return (
    <div className={styles.container}>
      {/* 1. OVERLAY (Lớp mờ) - Chỉ hiện khi sidebar mở */}
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ""}`}
        onClick={() => setIsOpen(false)} // Bấm ra ngoài thì đóng menu
      />

      {/* 2. SIDEBAR */}
      <div className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`}>
        {/* Nút Toggle gắn liền bên cạnh Sidebar */}
        <button className={styles.toggleBtn} onClick={toggleSidebar}>
          {isOpen ? <ChevronLeft /> : <ChevronRight />}
        </button>

        {/* Header */}
        <div className={styles.header}>
          <h2>Menu</h2>
        </div>

        {/* Menu Items */}
        <div className={styles.menu}>
          <div
            className={`${styles.menuItem} ${
              activeItem === "info" ? styles.active : ""
            }`}
            onClick={() => {
              window.location.href = "/customer/info";
            }}
          >
            <UserIcon />
            <span>Thông tin khách hàng</span>
          </div>

          <div
            className={`${styles.menuItem} ${
              activeItem === "history" ? styles.active : ""
            }`}
            onClick={() => {
              window.location.href = "/customer/history";
            }}
          >
            <BagIcon />
            <span>Lịch sử mua hàng</span>
          </div>
        </div>

        {/* Footer Logout */}
        <div className={styles.footer}>
          <button
            className={styles.backButton}
            onClick={() => (window.location.href = "/")}
          >
            <i className="fa-regular fa-house"></i>
            Quay về trang chủ
          </button>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogoutIcon />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* 3. MAIN CONTENT */}
      <main className={styles.mainContent}>{children}</main>
    </div>
  );
};

export default AppLayout;
