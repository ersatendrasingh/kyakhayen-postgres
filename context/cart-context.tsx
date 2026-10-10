"use client";

import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { CartItem } from "@/types/cart-item";

interface CartContextType {
  cartItems: CartItem[];
  isHydrated: boolean;
  addToCart: (item: CartItem) => void;
  updateQuantityInCart: (id: string, newQuantity: number) => void;
  removeFromCart: (id: string) => void;
  emptyCart: () => void;
}

const CartContext = createContext<CartContextType>({
  cartItems: [],
  isHydrated: false,
  addToCart: () => {},
  updateQuantityInCart: () => {},
  removeFromCart: () => {},
  emptyCart: () => {},
});

export const useCart = () => useContext(CartContext);

export const CartProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const localStorageCartItems = localStorage.getItem("cartItems");
        if (localStorageCartItems) {
          const persistedCart = JSON.parse(localStorageCartItems);
          if (Array.isArray(persistedCart)) {
            setCartItems(persistedCart);
          } else {
            localStorage.removeItem("cartItems");
          }
        }
      } catch {
        localStorage.removeItem("cartItems");
      } finally {
        setIsHydrated(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const addToCart = (item: CartItem) => {
    // Replace the entire cart with the new item
    const newCartItems = [item];

    // Update the state and localStorage
    setCartItems(newCartItems);
    localStorage.setItem("cartItems", JSON.stringify(newCartItems));
  };

  const updateQuantityInCart = (id: string, newQuantity: number) => {
    const existingCartItemsJSON = localStorage.getItem("cartItems");
    const existingCartItems: CartItem[] = existingCartItemsJSON
      ? JSON.parse(existingCartItemsJSON)
      : [];
    const updatedQuantity = Math.max(newQuantity, 1);
    const itemIndex = existingCartItems.findIndex((item) => item.id === id);

    if (itemIndex === -1) {
      return;
    }
    const updatedCartItems = [...existingCartItems];

    updatedCartItems[itemIndex].quantity = updatedQuantity;
    setCartItems(updatedCartItems);
    localStorage.setItem("cartItems", JSON.stringify(updatedCartItems));
  };

  const removeFromCart = (id: string) => {
    const existingCartItemsJSON = localStorage.getItem("cartItems");
    const existingCartItems: CartItem[] = existingCartItemsJSON
      ? JSON.parse(existingCartItemsJSON)
      : [];
    const updatedCartItems = existingCartItems.filter((item) => item.id !== id);
    setCartItems(updatedCartItems);
    localStorage.setItem("cartItems", JSON.stringify(updatedCartItems));
  };

  const emptyCart = () => {
    setCartItems([]); // Clear the cart items from state
    localStorage.removeItem("cartItems"); // Remove cart items from localStorage
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isHydrated,
        addToCart,
        updateQuantityInCart,
        removeFromCart,
        emptyCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
