# Hướng Dẫn Cài Đặt và Chạy Dự Án Medical-Website

Dự án này bao gồm 3 phần chính:
1.  **BE** (Backend - Node.js/Express)
2.  **Frontend** (User Website - React/Vite)
3.  **Admin** (Admin Dashboard - React/Vite)

## Yêu Cầu Hệ Thống
-   [Node.js](https://nodejs.org/) (Khuyên dùng phiên bản LTS v18 trở lên)
-   [MongoDB](https://www.mongodb.com/) (Nên cài đặt MongoDB Compass để quản lý database)
-   Git

## Hướng Dẫn Cài Đặt Chi Tiết

### 1. Clone Dự Án
```bash
git clone <đường-dẫn-repo-của-bạn>
cd Medical-Website
```

### 2. Cài Đặt Backend (BE)
Backend chịu trách nhiệm xử lý API và kết nối Database.

1.  Di chuyển vào thư mục BE:
    ```bash
    cd BE
    ```
2.  Cài đặt thư viện:
    ```bash
    npm install
    ```
3.  Cấu hình biến môi trường:
    -   Copy file `.env.example` thành `.env`:
        ```bash
        cp .env.example .env
        ```
    -   Mở file `.env` và cập nhật thông tin (ví dụ DB URL, Email Service, VNPay config...).

4.  Khởi chạy server (Chế độ Dev):
    ```bash
    npm run dev
    ```
    *Backend sẽ chạy tại: `http://localhost:3000`*

### 3. Cài Đặt Web Người Dùng (Frontend)
Website bán hàng dành cho khách hàng.

1.  Mở terminal mới, di chuyển vào thư mục Frontend:
    ```bash
    cd ../Frontend
    ```
2.  Cài đặt thư viện:
    ```bash
    npm install
    ```
3.  Khởi chạy trang web:
    ```bash
    npm run dev
    ```
    *Website sẽ chạy tại: `http://localhost:5173`*

### 4. Cài Đặt Trang Quản Trị (Admin)
Dashboard dành cho Quản lý và Nhân viên.

1.  Mở terminal mới, di chuyển vào thư mục Admin:
    ```bash
    cd ../Admin
    ```
2.  Cài đặt thư viện:
    ```bash
    npm install
    ```
3.  Khởi chạy Admin Dashboard:
    ```bash
    npm run dev
    ```
    *Admin Dashboad sẽ chạy tại: `http://localhost:5174` (hoặc port khác nếu 5173 bận)*

## Tổng Kết Các Lệnh Chạy
Bạn cần mở **3 tab terminal** riêng biệt để chạy song song cả hệ thống:

*   **Terminal 1 (Backend)**: `cd BE && npm run dev`
*   **Terminal 2 (Frontend)**: `cd Frontend && npm run dev`
*   **Terminal 3 (Admin)**: `cd Admin && npm run dev`

## Lưu Ý Thường Gặp
-   **Lỗi kết nối DB**: Kiểm tra xem MongoDB đã chạy chưa và chuỗi kết nối trong file `BE/.env` có đúng không.
-   **Lỗi CORS**: Nếu Frontend không gọi được API, kiểm tra cấu hình CORS trong `BE/app.js`.
-   **Lỗi hiển thị ảnh**: Đảm bảo thư mục `Frontend/public/images` có đầy đủ tài nguyên.
