import { useRef, useState, useEffect } from "react";
import styles from "../CSS/Header.module.css";

import { useNavigate } from "react-router";
import { createSearchParams } from "react-router";
import { useAuth } from "../../../contexts/AuthContext";

interface Product {
  id: number;
  productName: string;
  img: string;
  cost: number;
  [key: string]: unknown; // Cho phép các trường khác nếu có
}

export const Header = () => {
  const [valueOfFind, setValueOfFind] = useState<string>("");
  const [productsData, setProductsData] = useState<Product[]>([]);
  const [isFocus, setIsFocus] = useState(false);
  const timerRef = useRef<number | null>(null);
  const [isProductList, setIsProductList] = useState(false);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const lastScrollY = useRef(0);

  // Auth context for user info
  const { user, isLoggedIn, isStaff, logout } = useAuth();

  const productList = isProductList ? styles.active : "";
  const headerHidden = isHeaderHidden ? styles["header-hidden"] : "";
  const data = localStorage.getItem("shoppingCart") || "[]";
  const ProductList = JSON.parse(data);

  useEffect(() => {
    const tmp = localStorage.getItem("products");
    if (tmp) {
      try {
        setProductsData(JSON.parse(tmp));
      } catch (e) {
        console.error("Loi", e);
      }
    }
  }, []);

  const navigate = useNavigate();
  const handleSetValueOfFind = (value: string) => {
    setValueOfFind(value);
  };
  const handleSetIsFocusTrue = () => {
    setIsFocus(true);
  };
  const handleSetIsFocusFalse = () => {
    setIsFocus(false);
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
  };

  const handleProductMouseLeave = () => {
    timerRef.current = setTimeout(() => {
      setIsProductList(false);
    }, 100);
  };
  useEffect(() => {
    if (isHeaderHidden) {
      setIsFocus(false); // Tắt trạng thái focus (ẩn danh sách sản phẩm) của thanh tìm kiếm

      // (Tùy chọn) Nếu bạn muốn con trỏ chuột cũng thoát khỏi ô input (không nhấp nháy nữa)
      // thì cần thêm một bước dùng useRef (xem hướng dẫn nâng cao bên dưới)
    }
  }, [isHeaderHidden]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsHeaderHidden(true);
      } else if (currentScrollY < lastScrollY.current) {
        setIsHeaderHidden(false);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
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
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <>
      <header id="header" className={headerHidden}>
        <div className={styles.logo}>
          <img
            src="/images/logo.png"
            alt="Logo công ty"
            onClick={landingPageLink}
          />
        </div>

        <nav className={styles.navigation}>
          <a href="/contact">Contact</a>
          <a
            href="/product"
            className={styles.product}
            id="product"
            onMouseEnter={handleProductMouseEnter}
            onMouseLeave={handleProductMouseLeave}
          >
            Product
            <i className="fa-solid fa-chevron-down"></i>{" "}
          </a>
          <div
            className={`${styles["list-product"]} ${productList}`}
            id="listProduct"
            onMouseEnter={handleProductMouseEnter}
            onMouseLeave={handleProductMouseLeave}
          >
            <a href="/product">Tất cả sản phẩm</a>
            <a href="/product?filter=prescription">Thuốc theo đơn</a>
            <a href="/product?filter=otc">Thuốc không theo đơn</a>
          </div>
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
          {isFocus && (
            <section className={styles.productsList}>
              {productsData
                .filter((product) =>
                  product.productName.toLowerCase().includes(valueOfFind)
                )
                .map((item) => (
                  <div
                    className={styles.productItem}
                    onMouseDown={() => toDetailProduct(item.id)}
                  >
                    <div className={styles.image}>
                      <img src={item.img} alt="" />
                    </div>
                    <div className={styles.description}>
                      <p className={styles.productName}> {item.productName}</p>
                      <br />
                      <p className={styles.cost}>
                        {" "}
                        {new Intl.NumberFormat("vi-VN").format(item.cost)}đ
                      </p>
                    </div>
                  </div>
                ))}
            </section>
          )}
        </nav>

        {/* Right side - User info and Cart */}
        <div className={styles.userActions}>
          {isLoggedIn ? (
            <>
              {isStaff && user?.warehouse && (
                <span className={styles.staffBadge}>
                  {user.warehouse.name}
                </span>
              )}
              <span className={styles.userName}>
                {user?.fullName || 'User'}
              </span>
              <button className={styles.logoutBtn} onClick={handleLogout}>
                Đăng xuất
              </button>
            </>
          ) : (
            <button className={styles["btnLogin-popup"]} onClick={loginPageLink}>
              Login
            </button>
          )}
          <button
            className={styles["btnShoppingCart"]}
            onClick={toShoppingCart}
          >
            <i className="fa-solid fa-cart-shopping"></i> Giỏ hàng
            <div className={styles.countProduct}>{ProductList.length}</div>
          </button>
        </div>
      </header>
    </>
  );
};
