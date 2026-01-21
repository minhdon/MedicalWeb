import { useRef, useState, useEffect } from "react";
import styles from "../CSS/Header.module.css";
import { useNavigate } from "react-router";
import { createSearchParams } from "react-router";
import { useProductFetcher, type ApiData } from "../../CallApi/CallApiProduct";
import { useAuth } from "../../../contexts/AuthContext.tsx";
import { useCart } from "../../../contexts/CartContext";

export const Header = () => {
  // --- CODE CŨ GIỮ NGUYÊN ---
  const [valueOfFind, setValueOfFind] = useState<string>("");
  const [productsData, setProductsData] = useState<ApiData[]>([]);
  const [isFocus, setIsFocus] = useState(false);
  const timerRef = useRef<number | null>(null);
  const [isProductList, setIsProductList] = useState(false);
  const { cartCount } = useCart();
  const { data: rawData } = useProductFetcher();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  // --- PHẦN MỚI THÊM VÀO (STATE CHO MOBILE) ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- LOGIC CŨ ---
  useEffect(() => {
    if (rawData) {
      setProductsData(rawData);
    }
  }, [rawData]);

  const handleSetValueOfFind = (value: string) => {
    setValueOfFind(value);
  };
  const handleSetIsFocusTrue = () => {
    setIsFocus(true);
  };
  const handleSetIsFocusFalse = () => {
    // Thêm timeout nhỏ để kịp click vào item trước khi nó ẩn
    setTimeout(() => setIsFocus(false), 200);
  };
  const handleProductMouseEnter = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setIsProductList(true);
  };
  const toDetailProduct = (id: number) => {
    navigate({
      pathname: "/DetailProduct",
      search: createSearchParams({ productId: id.toString() }).toString(),
    });
    // Thêm: Đóng menu mobile khi chọn sản phẩm
    setIsMobileMenuOpen(false);
  };
  const handleProductMouseLeave = () => {
    timerRef.current = setTimeout(() => {
      setIsProductList(false);
    }, 100);
  };
  const landingPageLink = () => {
    window.location.href = "/";
  };
  const loginPageLink = () => {
    window.location.href = "/login";
  };
  const toShoppingCart = () => {
    navigate({
      pathname: "/ShoppingCart",
    });
    setIsMobileMenuOpen(false);
  };

  // --- HÀM MỚI: Toggle Menu Mobile ---
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Logic class cho dropdown product
  const productListClass = isProductList ? styles.active : "";
  // Logic class cho mobile menu nav
  const navClass = isMobileMenuOpen
    ? `${styles.navigation} ${styles.active}`
    : styles.navigation;

  return (
    <>
      <header id="hero" className={styles.header}>
        <div className={styles.logo}>
          <img
            src="/images/logo.png"
            alt="Logo công ty"
            onClick={landingPageLink}
          />
        </div>

        {/* --- PHẦN MỚI: NÚT ICON MENU (Chỉ hiện trên mobile nhờ CSS) --- */}
        <div className={styles.menuToggle} onClick={toggleMobileMenu}>
          {/* Icon thay đổi tùy trạng thái: Bars hoặc X */}
          <i
            className={
              isMobileMenuOpen ? "fa-solid fa-times" : "fa-solid fa-bars"
            }
          ></i>
        </div>

        {/* Cập nhật className ở đây: thay styles.navigation bằng navClass */}
        <nav className={navClass}>
          <a href="/contact">Contact</a>
          <a
            href="/product"
            className={styles.product}
            id="product"
            onMouseEnter={handleProductMouseEnter}
            onMouseLeave={handleProductMouseLeave}
            // Thêm sự kiện click để mở dropdown trên mobile (vì mobile không có hover)
            onClick={(e) => {
              e.preventDefault();
              setIsProductList(!isProductList);
            }}
          >
            Product
            <i className="fa-solid fa-chevron-down"></i>{" "}
          </a>
          <div
            className={`${styles["list-product"]} ${productListClass}`}
            id="listProduct"
            onMouseEnter={handleProductMouseEnter}
            onMouseLeave={handleProductMouseLeave}
          >
            <a href="/product">Tất cả sản phẩm</a>
            <a href="/product#thuốc-theo-đơn">Thuốc theo đơn</a>
            <a href="/product#thuốc-không-theo-đơn">Thuốc không theo đơn</a>
          </div>
          <div className={styles.searchBox}>
            <input
              type="text"
              className={styles["find-product"]}
              required
              placeholder="Tìm tên thuốc"
              onFocus={handleSetIsFocusTrue}
              onBlur={handleSetIsFocusFalse}
              onClick={handleSetIsFocusTrue}
              value={valueOfFind}
              onChange={(e) => handleSetValueOfFind(e.target.value)}
            />
            {isFocus && rawData && (
              <section className={styles.productsList}>
                {productsData
                  .filter((product) =>
                    product.productName.toLowerCase().includes(valueOfFind),
                  )
                  .map((item) => (
                    <div
                      key={item.id}
                      className={styles.productItem}
                      onMouseDown={() => toDetailProduct(Number(item.id))}
                    >
                      <div className={styles.image}>
                        <img src={item.img} alt="" />
                      </div>
                      <div className={styles.description}>
                        <p className={styles.productName}>{item.productName}</p>
                        <br />
                        <p className={styles.cost}> {item.cost}</p>
                      </div>
                    </div>
                  ))}
              </section>
            )}
          </div>
          {!isLoggedIn && (
            <button
              className={styles["btnLogin-popup"]}
              onClick={loginPageLink}
            >
              Login
            </button>
          )}{" "}
          <button
            className={styles["btnShoppingCart"]}
            onClick={toShoppingCart}
          >
            {" "}
            <i className="fa-solid fa-cart-shopping"></i> Giỏ hàng{" "}
            <div className={styles.countProduct}>{cartCount}</div>
          </button>
          {isLoggedIn && (
            <button
              className={styles.customerIcon}
              onClick={() => (window.location.href = "/customer/info")}
            >
              <i className="fa-regular fa-user"></i>
            </button>
          )}
        </nav>
      </header>
    </>
  );
};
