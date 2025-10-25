"use client";

import CartContext, { ProductCartItem } from "@/context/CartContext";
import { useState } from "react";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<ProductCartItem[]>([]);

  return <CartContext.Provider value={{ cart, setCart }}>{children}</CartContext.Provider>;
}
