# Tài liệu Hệ thống Medical Website

## 1. Sơ đồ Luồng Hoạt động (Operation Flows)

### 1.1. Luồng Đăng ký & Đăng nhập (Authentication Flow)
- **Khách hàng (Customer):**
    1.  Người dùng truy cập trang Đăng ký.
    2.  Nhập thông tin (Tên đăng nhập, Mật khẩu, Email/SĐT).
    3.  Hệ thống tạo tài khoản mới và tự động gán vai trò **Customer**.
    4.  Người dùng đăng nhập bằng Email/SĐT/Username + Mật khẩu.
- **Nhân viên (Staff):**
    1.  Admin tạo tài khoản nhân viên từ trang quản trị (Admin Panel).
    2.  Admin gán vai trò (Admin, Staff, WarehouseStaff) và kho làm việc (nếu là Staff).
    3.  Nhân viên đăng nhập:
        *   **Admin/WarehouseStaff:** Đăng nhập vào Admin Panel.
        *   **Staff (Bán hàng):** Chỉ được phép đăng nhập vào Website Frontend (POS) để bán hàng.

### 1.2. Luồng Mua hàng Online (Online Order Flow)
1.  Khách hàng thêm sản phẩm vào Giỏ hàng.
2.  Tiến hành Thanh toán (Checkout) -> Chọn địa chỉ, phương thức thanh toán (COD/VNPay).
3.  Hệ thống tạo hóa đơn (`SaleInvoice`) với trạng thái **Chờ xác nhận** (`Pending`).
4.  Admin duyệt đơn -> Chuyển trạng thái **Đang giao** (`Shipping`).
5.  Khách hàng nhận hàng -> Đơn hàng hoàn tất (`Delivered`).

### 1.3. Luồng Bán hàng Tại quầy (In-Store Sale Flow / POS)
1.  Nhân viên (Staff) đăng nhập vào Website.
2.  Chọn khách hàng (hoặc Khách lẻ).
3.  Chọn sản phẩm và số lượng từ kho của chi nhánh mình (`User.warehouseId`).
4.  Xác nhận thanh toán (Tiền mặt/Chuyển khoản).
5.  Hệ thống tạo hóa đơn (`SaleInvoice`) với:
    *   `isInStoreSale`: true
    *   `warehouseId`: Kho của nhân viên
    *   `statusId`: Đã giao hàng (`Delivered`)
    *   Kho tự động trừ tồn kho.

### 1.4. Luồng Quản lý Kho (Inventory Management Flow)
1.  **Nhập kho (Import):** Hàng hóa được nhập vào Kho tổng (`WarehouseType: central`).
2.  **Chuyển kho (Transfer):**
    *   Admin/Kho tổng tạo phiếu chuyển kho (`InventoryTransfer`) từ Kho tổng -> Kho chi nhánh.
    *   Kho chi nhánh nhận hàng -> Hệ thống cập nhật tồn kho: Trừ kho tổng, Cộng kho chi nhánh.

---

## 2. Cơ sở Dữ liệu & Ý nghĩa các Bảng (Database Schema)

### 2.1. Bảng Người dùng & Phân quyền (`auth`)

| Tên Bảng (Collection) | Ý nghĩa (Description) | Các trường chính (Key Fields) |
| :--- | :--- | :--- |
| **User** | Lưu thông tin người dùng (Khách hàng & Nhân viên) | `userName`, `passWord`, `email`, `phoneNum`, `roleId` (Vai trò), `warehouseId` (Kho làm việc - với NV) |
| **Role** | Định nghĩa các vai trò trong hệ thống | `roleName` (vd: Admin, Staff, Customer, WarehouseStaff), `description` |

### 2.2. Bảng Sản phẩm (`product`)

| Tên Bảng (Collection) | Ý nghĩa (Description) | Các trường chính (Key Fields) |
| :--- | :--- | :--- |
| **Product** | Thông tin chi tiết sản phẩm thuốc | `productId`, `productName`, `price` (Giá bán), `stockQuantity` (Tổng tồn), `unit`, `variants` (Đơn vị quy đổi) |
| **Category** | Danh mục sản phẩm | `categoryName`, `description` |
| **Manufacturer** | Nhà sản xuất | `manufacturerName`, `address` |
| **ProductBatch** | Lô sản phẩm (Quản lý hạn sử dụng & Tồn kho theo kho) | `productId`, `warehouseId`, `batchNumber` (Số lô), `expiryDate` (HSD), `quantity` (Tồn kho thực tế) |

### 2.3. Bảng Kho & Xuất nhập (`warehouse`)

| Tên Bảng (Collection) | Ý nghĩa (Description) | Các trường chính (Key Fields) |
| :--- | :--- | :--- |
| **Warehouse** | Danh sách các kho hàng (Tổng & Chi nhánh) | `warehouseName`, `address`, `warehouseType` (central/branch) |
| **InventoryTransfer** | Phiếu chuyển kho | `fromWarehouseId`, `toWarehouseId`, `products` (DS sản phẩm), `status` (pending/completed) |

### 2.4. Bảng Đơn hàng & Hóa đơn (`saleInvoice`)

| Tên Bảng (Collection) | Ý nghĩa (Description) | Các trường chính (Key Fields) |
| :--- | :--- | :--- |
| **SaleInvoice** | Hóa đơn bán hàng (Đơn hàng) | `saleDate`, `userId` (Khách hàng), `staffId` (NV bán), `totalAmount`, `paymentMethod`, `paymentStatus`, `statusId` |
| **SaleInvoiceDetail** | Chi tiết đơn hàng (Sản phẩm trong đơn) | `saleInvoiceId`, `productId`, `quantity`, `unitPrice` |
| **OrderStatus** | Trạng thái đơn hàng | `statusName` (Pending, Shipping, Delivered, Cancelled) |

### 2.5. Bảng Nhập hàng (`purchaseInvoice`)

| Tên Bảng (Collection) | Ý nghĩa (Description) | Các trường chính (Key Fields) |
| :--- | :--- | :--- |
| **PurchaseInvoice** | Hóa đơn nhập hàng từ nhà cung cấp | `staffId` (NV nhập), `totalAmount`, `importDate`, `supplierName` |
