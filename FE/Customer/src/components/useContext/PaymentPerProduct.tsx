/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  useState,
  type DO_NOT_USE_OR_YOU_WILL_BE_FIRED_EXPERIMENTAL_IMG_SRC_TYPES,
  type ReactNode,
} from "react";

interface Product {
  id: number;
  productName: string;
  cost: number;
  status: boolean;
  img: string;
  productDesc: string;
  quantity: number;
  [key: string]: unknown;
}

export type paymentPerProductType = {
  paymentProducts: Product[];
  setPaymentProducts: (item: Product) => void;
  handleIncreaseQuantity: (id: number) => void;
  handleDecreaseQuantity: (id: number) => void;
  handleSetQuantity: (
    id: number,
    value: DO_NOT_USE_OR_YOU_WILL_BE_FIRED_EXPERIMENTAL_IMG_SRC_TYPES
  ) => void;
  handleDeleteProduct: (id: number) => void;
};
const paymentPerProductContext = createContext<paymentPerProductType>({
  paymentProducts: [],
  setPaymentProducts: () => {},
  handleIncreaseQuantity: () => {},
  handleDecreaseQuantity: () => {},
  handleSetQuantity: () => {},
  handleDeleteProduct: () => {},
});
type paymentPerProductProps = {
  children: ReactNode;
};
function PaymentPerProductProvider({ children }: paymentPerProductProps) {
  const [paymentProduct, setPaymentProducts] = useState<Product[]>([]);

  const handleSetPaymentProducts = (newItem: Product) => {
    setPaymentProducts((prevProducts) => {
      const existingIndex = prevProducts.findIndex(
        (item) => item.id == newItem.id
      );
      if (existingIndex < 0) {
        return [...prevProducts, { ...newItem, quantity: 1 }];
      }
      return prevProducts;
    });
  };
  const handleIncreaseQuantity = (id: number) => {
    setPaymentProducts((prevProducts) => {
      return prevProducts.map((item) => {
        if (item.id == id) {
          return { ...item, quantity: item.quantity + 1 };
        }
        return item;
      });
    });
  };
  const handleDecreaseQuantity = (id: number) => {
    setPaymentProducts((prevProducts) => {
      return prevProducts.map((item) => {
        if (item.id == id && item.quantity > 1) {
          return { ...item, quantity: item.quantity - 1 };
        }
        return item;
      });
    });
  };
  const handleDeleteProduct = (id: number) => {
    setPaymentProducts((prevProducts) => {
      return prevProducts.filter((item) => item.id !== id);
    });
  };
  const value = {
    paymentProducts: paymentProduct,
    setPaymentProducts: handleSetPaymentProducts,
    handleIncreaseQuantity: handleIncreaseQuantity,
    handleDecreaseQuantity: handleDecreaseQuantity,
    handleDeleteProduct: handleDeleteProduct,
    handleSetQuantity: handleDecreaseQuantity,
  };
  return (
    <paymentPerProductContext.Provider value={value}>
      {children}
    </paymentPerProductContext.Provider>
  );
}
export { paymentPerProductContext, PaymentPerProductProvider };
