import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface CartItem {
  _id: string;
  productName: string;
  cost: number;
  quantity: number;
  unit?: string;
  img: string;
  status: boolean;
  [key: string]: unknown;
}

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string, unit: string) => void;
  updateCart: (items: CartItem[]) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    // Return default values when not wrapped in CartProvider
    return {
      cartItems: [],
      cartCount: 0,
      addToCart: () => {},
      removeFromCart: () => {},
      updateCart: () => {},
      clearCart: () => {},
    };
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('shoppingCart');
      if (stored) {
        setCartItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading cart:', e);
    }
  }, []);

  // Listen for storage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'shoppingCart' && e.newValue) {
        try {
          setCartItems(JSON.parse(e.newValue));
        } catch (err) {
          console.error('Error parsing cart from storage event:', err);
        }
      }
    };

    // Listen for custom cart update events (same tab)
    const handleCartUpdate = (e: CustomEvent) => {
      if (e.detail) {
        setCartItems(e.detail);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cartUpdated', handleCartUpdate as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cartUpdated', handleCartUpdate as EventListener);
    };
  }, []);

  const cartCount = cartItems.length;

  const addToCart = (item: CartItem) => {
    const newItems = [...cartItems, item];
    setCartItems(newItems);
    localStorage.setItem('shoppingCart', JSON.stringify(newItems));
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: newItems }));
  };

  const removeFromCart = (id: string, unit: string) => {
    const newItems = cartItems.filter(item => !(item._id === id && item.unit === unit));
    setCartItems(newItems);
    localStorage.setItem('shoppingCart', JSON.stringify(newItems));
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: newItems }));
  };

  const updateCart = (items: CartItem[]) => {
    setCartItems(items);
    localStorage.setItem('shoppingCart', JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: items }));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.setItem('shoppingCart', JSON.stringify([]));
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: [] }));
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      cartCount,
      addToCart,
      removeFromCart,
      updateCart,
      clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};
