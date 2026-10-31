"use client";

import { useMemo, useState } from "react";

import CartContext, { ProductCartItem } from "@/context/CartContext";

export function CartProvider({ children }: { children: React.ReactNode }) {
  // Active bill (0 = Bill 1, 1 = Bill 2, 2 = Bill 3)
  const [activeBill, setActiveBill] = useState(0);

  // Three independent carts
  const [carts, setCarts] = useState<ProductCartItem[][]>([
    [],
    [],
    [],
  ]);

  // Current active cart
  const cart = useMemo(() => carts[activeBill], [carts, activeBill]);

  // Update only the active cart
  const setCart = (
    value:
      | ProductCartItem[]
      | ((prev: ProductCartItem[]) => ProductCartItem[])
  ) => {
    setCarts((prev) => {
      const copy = [...prev];

      copy[activeBill] =
        typeof value === "function"
          ? value(copy[activeBill])
          : value;

      return copy;
    });
  };

  return (
    <CartContext.Provider
      value={{
        activeBill,
        setActiveBill,
        carts,
        setCarts,
        cart,
        setCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}