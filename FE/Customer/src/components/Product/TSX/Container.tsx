import styles from "../CSS/Container.module.css";

import { ProductNavigation } from "./ProductNavigation";
import { ShopLayout } from "./ShopLayout";

export const Container = () => {
  return (
    <>
      <section className={styles.container}>
        {" "}
        <ProductNavigation />
        <ShopLayout />
      </section>
    </>
  );
};
