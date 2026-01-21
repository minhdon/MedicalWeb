import React, { useState, useContext, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, createSearchParams, useSearchParams } from "react-router";
import { fetchProductsByPage, type ApiData } from "../CallApi/CallApiProduct";
import { SortContext } from "../useContext/priceSortContext";

import { useAuth } from "../../contexts/AuthContext";

import styles from "./ProductList.module.css";

const PRODUCTS_PER_PAGE = 8; // Client config
// Server sẽ nhận limit này

interface CartItem extends ApiData {
  quantity: number;
}

const DataFetcher: React.FC = () => {
  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAcceptAddToCart, setIsAcceptAddToCart] = useState(true);

  // Function to show toast message
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2000); // Tự động đóng sau 0.5s
  };
  // Get authentication state for role-based visibility
  const { isStaff } = useAuth();

  // Thay thế useProductFetcher bằng Logic Server-Pagination & Prefetching
  const [productsMap, setProductsMap] = useState<Record<number, ApiData[]>>({}); // Cache
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sortContext = useContext(SortContext);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [currentPage, setCurrentPage] = useState(1);
  const maxPriceQuery = searchParams.get("maxPrice");
  const minPriceQuery = searchParams.get("minPrice");
  const filterQuery = searchParams.get("filter");
  const brandQuery = searchParams.getAll("brand");
  const countryQuery = searchParams.getAll("country");

  // Hàm load dữ liệu 1 trang
  const loadPage = async (page: number) => {
    // Tạo cache key unique theo page và filter
    const cacheKey = `${page}-${filterQuery || "all"}-${brandQuery.join(",")}-${countryQuery.join(",")}-${minPriceQuery}-${maxPriceQuery}`;

    // Nếu đã có data cho key này thì dùng lại
    // Tuy nhiên hiện tại productsMap đang key theo number (page).
    // Để fix nhanh bug "không hiện chức năng" (do cache cũ đè lên), ta sẽ TẠM THỜI BỎ qua check cache nếu có filter.
    // Hoặc đơn giản là clear cache hiệu quả hơn.

    // Fix: Luôn fetch mới nếu cache chưa khớp logic phức tạp.
    // Cách đơn giản nhất:
    // Vì ta đã empty cache khi filter đổi, logic ở dưới `if (productsMap[page]) return` có thể sai do race condition.
    // -> BỎ CHECK CACHE ở đây để đảm bảo data luôn đúng khi đổi filter.
    // (Performance có thể giảm chút xíu nhưng đảm bảo function work)

    try {
      if (page === currentPage) setLoading(true); // Always show loading when fetching main page

      const filters = {
        filter: filterQuery,
        minPrice: minPriceQuery,
        maxPrice: maxPriceQuery,
        brand: brandQuery,
        origin: countryQuery, // Map 'country' param to 'origin' backend field if needed, or keep 'country' and handle in BE
      };

      const res = await fetchProductsByPage(page, PRODUCTS_PER_PAGE, filters);

      setProductsMap((prev) => ({ ...prev, [page]: res.data }));
      if (page === currentPage) {
        setTotalPages(res.pagination.totalPages);
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Effect chính: Load trang hiện tại VÀ Prefetch
  useEffect(() => {
    const run = async () => {
      await loadPage(currentPage);
      // Prefetch logic (unchanged)
      if (currentPage + 1 <= totalPages) loadPage(currentPage + 1);
      if (currentPage + 2 <= totalPages) loadPage(currentPage + 2);
    };
    run();
  }, [
    currentPage,
    filterQuery,
    minPriceQuery,
    maxPriceQuery,
    JSON.stringify(brandQuery),
    JSON.stringify(countryQuery),
  ]);

  // Reset pagination khi filter thay đổi
  useEffect(() => {
    setCurrentPage(1);
    setProductsMap({});
  }, [
    maxPriceQuery,
    minPriceQuery,
    sortContext.typeSort,
    filterQuery,
    JSON.stringify(brandQuery),
    JSON.stringify(countryQuery),
  ]);

  // Data hiển thị: Lấy từ Cache State
  const currentProducts = productsMap[currentPage] || [];

  // Logic hiển thị Pagination (Giữ nguyên UI, chỉ đổi logic tính toán)
  // const totalPages  -> đã có từ State
  // const indexOfLastProduct  -> Không cần tính để slice nữa

  const toDetailProduct = (id: number) => {
    navigate({
      pathname: "/DetailProduct",
      search: createSearchParams({ productId: id.toString() }).toString(),
    });
  };

  const handleAddToCart = (item: ApiData, isBuyNow = false) => {
    // Default unit fallback
    const unitToAdd = item.unit || "Hộp";

    // 1. Nếu Mua Ngay -> Lưu vào storage RIÊNG 'buyNowCart' -> Không ảnh hưởng giỏ hàng chính
    if (isBuyNow) {
      // Chỉ lưu 1 sản phẩm duy nhất vào buyNowCart
      const buyNowItem: CartItem = {
        ...item,
        quantity: 1,
        unit: unitToAdd,
        status: true,
      };
      localStorage.setItem("buyNowCart", JSON.stringify([buyNowItem]));
      navigate("/ShoppingCart?mode=buy_now");
      return;
    }

    // 2. Logic Thêm vào giỏ thường (Giữ nguyên)
    const cartData = localStorage.getItem("shoppingCart");
    // Ensure status field exists
    const cartItems: CartItem[] = cartData ? JSON.parse(cartData) : [];

    // Check duplicate using _id and unit
    const existingItemIndex = cartItems.findIndex(
      (cartItem) =>
        String(cartItem._id) === String(item._id) &&
        cartItem.unit === unitToAdd,
    );

    if (existingItemIndex < 0) {
      // Add new item with status = true
      const newItem: CartItem = {
        ...item,
        quantity: 1,
        unit: unitToAdd,
        status: true,
      };
      cartItems.push(newItem);
    } else {
      // Update quantity
      cartItems[existingItemIndex].quantity += 1;
    }

    localStorage.setItem("shoppingCart", JSON.stringify(cartItems));
    // Dispatch event for Header cart count update
    window.dispatchEvent(new CustomEvent("cartUpdated", { detail: cartItems }));
    showToast(`Đã thêm ${item.productName} vào giỏ hàng!`);
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  if (loading)
    return (
      <div>
        <strong>Đang tải dữ liệu...</strong>
      </div>
    );
  if (error) return <div style={{ color: "red" }}>Lỗi: {error}</div>;

  return (
    <>
      {/* Toast Notification - Góc phải trên (sử dụng Portal) */}
      {toastMessage &&
        isAcceptAddToCart == true &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              backgroundColor: "#3567cd",
              color: "#fff",
              padding: "12px 16px",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              zIndex: 9999,
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              animation: "slideIn 0.2s ease-out",
            }}
          >
            {toastMessage}
          </div>,
          document.body,
        )}
      {toastMessage &&
        isAcceptAddToCart == false &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              backgroundColor: "#b41111",
              color: "#fff",
              padding: "12px 16px",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              zIndex: 9999,
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              animation: "slideIn 0.2s ease-out",
            }}
          >
            {toastMessage}
          </div>,
          document.body,
        )}

      <style>
        {`
          @keyframes slideIn {
            from { opacity: 0; transform: translateX(20px); }
            to { opacity: 1; transform: translateX(0); }
          }
        `}
      </style>

      <div className={styles.hero}>
        {currentProducts.map((item) => (
          <div
            key={item.id}
            className={styles.component}
            onClick={() => toDetailProduct(item.id)}
          >
            <img src={item.img} alt={item.productName} />
            <div className={styles.desc}>
              {item.productName} <span>hỗ trợ </span> {item.productDesc}
            </div>

            {/* Logic hiển thị giá: Ẩn nếu là thuốc theo đơn VÀ không phải staff */}
            {item.category === "Thuốc theo đơn" && !isStaff ? (
              <p
                className={styles.price}
                style={{ color: "#d32f2f", fontSize: "14px" }}
              >
                Thuốc kê đơn
              </p>
            ) : (
              <p className={styles.price}>
                {new Intl.NumberFormat("vi-VN").format(item.cost)}đ
              </p>
            )}

            {/* Logic nút bấm: Thuốc kê đơn + Không phải staff => Tư vấn ngay, còn lại => Mua */}
            {item.category === "Thuốc theo đơn" && !isStaff ? (
              <button
                className={styles.button}
                style={{
                  backgroundColor: "#ff9800",
                  opacity: 0.9,
                  width: "100%",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAcceptAddToCart(false);
                  showToast(
                    "Sản phẩm cần tư vấn của Dược sĩ. Vui lòng liên hệ nhân viên!",
                  );
                }}
              >
                Tư vấn ngay
              </button>
            ) : (
              <div
                style={{
                  display: "flex",
                  gap: "5px",
                  width: "100%",
                  position: "absolute",
                  top: "400px",
                  left: "0",
                  padding: "0 10px",
                  boxSizing: "border-box",
                }}
              >
                <button
                  className={styles.button}
                  style={{
                    flex: 1,
                    backgroundColor: "#1d48ba",
                    fontSize: "13px",
                    padding: "5px",
                    position: "static",
                    width: "auto",
                    margin: 0,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart(item, true); // Mua ngay
                  }}
                >
                  Chọn mua
                </button>
                <button
                  className={styles.button}
                  style={{
                    flex: 1,
                    backgroundColor: "#fff",
                    color: "#1d48ba",
                    border: "1px solid #1d48ba",
                    fontSize: "13px",
                    padding: "5px",
                    position: "static",
                    width: "auto",
                    margin: 0,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAcceptAddToCart(true);
                    handleAddToCart(item, false); // Thêm vào giỏ
                  }}
                >
                  Thêm giỏ
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Phần phân trang giữ nguyên */}
      {totalPages > 1 && (
        <nav className={styles.paginationNav}>
          <ul>
            {(() => {
              const pageNumbers = [];
              if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
              } else {
                if (currentPage <= 4) {
                  for (let i = 1; i <= 5; i++) pageNumbers.push(i);
                  pageNumbers.push("...");
                  pageNumbers.push(totalPages);
                } else if (currentPage >= totalPages - 3) {
                  pageNumbers.push(1);
                  pageNumbers.push("...");
                  for (let i = totalPages - 4; i <= totalPages; i++)
                    pageNumbers.push(i);
                } else {
                  pageNumbers.push(1);
                  pageNumbers.push("...");
                  for (let i = currentPage - 1; i <= currentPage + 1; i++)
                    pageNumbers.push(i);
                  pageNumbers.push("...");
                  pageNumbers.push(totalPages);
                }
              }

              return pageNumbers.map((page, index) => (
                <li key={index}>
                  {page === "..." ? (
                    <span style={{ padding: "0 10px" }}>...</span>
                  ) : (
                    <button
                      onClick={() => handlePageChange(Number(page))}
                      className={currentPage === page ? styles.activePage : ""}
                    >
                      {page}
                    </button>
                  )}
                </li>
              ));
            })()}
          </ul>
        </nav>
      )}
    </>
  );
};

export default DataFetcher;
