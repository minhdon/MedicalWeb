import React from "react";
import styles from "../CSS/Filter.module.css";
import { useSearchParams } from "react-router";
import type { ApiData } from "../../CallApi/CallApiProduct";

export const Filter = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const products = localStorage.getItem("products");
  const productList: ApiData[] = products ? JSON.parse(products) : [];
  const countries = [...new Set(productList.map((p) => p.origin))];
  const brands = [...new Set(productList.map((p) => p.brand))];
  const [countryFilter, setCountryFilter] = React.useState<string>("");
  const [brandFilter, setBrandFilter] = React.useState<string>("");

  const handleMultiSelect = (key: string, value: string) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);

      const currentValues = newParams.getAll(key);

      if (currentValues.includes(value)) {
        newParams.delete(key);
        currentValues
          .filter((item) => item !== value)
          .forEach((item) => newParams.append(key, item));
      } else {
        newParams.append(key, value);
      }

      newParams.set("page", "1");
      return newParams;
    });
  };

  const handlePriceSelect = (min: string, max: string, isChecked: boolean) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);

      if (isChecked) {
        newParams.set("minPrice", min);
        if (max !== "Infinity") {
          newParams.set("maxPrice", max);
        } else {
          newParams.delete("maxPrice"); // Trường hợp > 500k
        }
      } else {
        newParams.delete("minPrice");
        newParams.delete("maxPrice");
      }

      newParams.set("page", "1");
      return newParams;
    });
  };

  const isChecked = (key: string, value: string) => {
    return searchParams.getAll(key).includes(value);
  };

  const isPriceChecked = (min: string) => {
    return searchParams.get("minPrice") === min;
  };

  return (
    <>
      <aside className={styles.sidebar}>
        <h3>BỘ LỌC</h3>

        <div className={styles["filter-group"]}>
          <h3>Lọc theo giá</h3>
          <ul>
            <li>
              <label>
                <input
                  type="checkbox"
                  onChange={(e) =>
                    handlePriceSelect("0", "100000", e.target.checked)
                  }
                  checked={
                    isPriceChecked("0") &&
                    searchParams.get("maxPrice") === "100000"
                  }
                />{" "}
                Dưới 100.000đ
              </label>
            </li>
            <li>
              <label>
                <input
                  type="checkbox"
                  onChange={(e) =>
                    handlePriceSelect("100000", "300000", e.target.checked)
                  }
                  checked={
                    isPriceChecked("100000") &&
                    searchParams.get("maxPrice") === "300000"
                  }
                />{" "}
                100.000đ - 300.000đ
              </label>
            </li>

            <li>
              <label>
                <input
                  type="checkbox"
                  onChange={(e) =>
                    handlePriceSelect("500000", "Infinity", e.target.checked)
                  }
                  checked={
                    isPriceChecked("500000") && !searchParams.has("maxPrice")
                  }
                />{" "}
                Trên 500.000đ
              </label>
            </li>
          </ul>
        </div>

        <div className={styles["filter-group"]}>
          <h3>Thương hiệu</h3>
          <input
            type="text"
            placeholder="Nhập tên thương hiệu"
            className={styles["search-input"]}
            onChange={(e) => setBrandFilter(e.target.value)}
          />
          <ul>
            {brands
              .filter(
                (item) =>
                  item &&
                  item.toLowerCase().includes(brandFilter.toLowerCase()),
              )
              .map((item) => (
                <li key={item}>
                  {" "}
                  {/* Key là bắt buộc, nên dùng giá trị duy nhất */}
                  <label>
                    <input
                      type="checkbox"
                      // Truyền value động vào hàm kiểm tra
                      checked={isChecked("brand", item || "")}
                      // Truyền value động vào hàm xử lý
                      onChange={() => handleMultiSelect("brand", item || "")}
                    />{" "}
                    {item}
                  </label>
                </li>
              ))}
          </ul>
        </div>

        {/* --- GROUP: QUỐC GIA --- */}
        <div className={styles["filter-group"]}>
          <h3>Nước sản xuất</h3>
          <input
            type="text"
            placeholder="Nhập tên quốc gia"
            onChange={(e) => setCountryFilter(e.target.value)}
          />
          <ul>
            {countries
              .filter(
                (item) =>
                  item &&
                  item.toLowerCase().includes(countryFilter.toLowerCase()),
              )
              .map((item) => (
                <li key={item}>
                  {" "}
                  {/* Key là bắt buộc, nên dùng giá trị duy nhất */}
                  <label>
                    <input
                      type="checkbox"
                      // Truyền value động vào hàm kiểm tra
                      checked={isChecked("country", item || "")}
                      // Truyền value động vào hàm xử lý
                      onChange={() => handleMultiSelect("country", item || "")}
                    />{" "}
                    {item} {/* Hiển thị tên quốc gia */}
                  </label>
                </li>
              ))}
          </ul>
        </div>
      </aside>
    </>
  );
};
