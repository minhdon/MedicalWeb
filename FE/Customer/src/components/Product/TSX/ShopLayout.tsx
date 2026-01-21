import { Filter } from "./Filter";
import styles from "../CSS/ShopLayout.module.css";
import { Sort } from "./SortHeader";
import { ProductList } from "./ProductList";
export const ShopLayout = () => {
  return (
    <section className={styles["shop-layout"]}>
      <Filter />
      <Sort />
      <ProductList />
    </section>
  );
};
