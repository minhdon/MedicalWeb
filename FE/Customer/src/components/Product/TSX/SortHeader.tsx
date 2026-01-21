import styles from "../CSS/SortHeader.module.css";
import { useContext } from "react";
import { SortContext } from "../../useContext/priceSortContext";
import { IndexContext } from "../../useContext/IndexProductContext";

export const Sort = () => {
  const sortContext = useContext(SortContext);
  const indexContext = useContext(IndexContext);
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = event.target.value;
    sortContext.setSortType(newValue);
  };

  return (
    <>
      <div className={styles["sort-header"]}>
        <span>
          Hiển thị {indexContext.CountIndex + 1} - {indexContext.CountIndex + 8}{" "}
          trên 104 sản phẩm
        </span>
        <label>
          Sắp xếp theo:
          <select id="sort-by" onChange={handleChange}>
            <option value="default">Mặc định</option>
            <option value="best-selling">Độ bán chạy</option>
            <option value="lowToHigh">Giá: Thấp đến cao</option>
            <option value="highToLow">Giá: Cao đến thấp</option>
          </select>
        </label>
      </div>
    </>
  );
};
