import DataFetcher from "../../ProductList/ProductList";
import styles from "../CSS/ProductList.module.css";

export const ProductList = () => {
  return (
    <>
      <div className={styles.hero}>
        <DataFetcher />
      </div>
    </>
  );
};
