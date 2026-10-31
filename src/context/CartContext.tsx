import { Product, Product_Variant } from "@/types/prisma-types";
import { createContext, Dispatch, SetStateAction } from "react";

export type ProductCartItem = Product & {
  variant: Product_Variant;
  quantity: number;
};

export type UserContextType = {
  // Current active bill
  activeBill: number;
  setActiveBill: Dispatch<SetStateAction<number>>;

  // All bills
  carts: ProductCartItem[][];
  setCarts: Dispatch<SetStateAction<ProductCartItem[][]>>;

  // Active cart
  cart: ProductCartItem[];
  setCart: Dispatch<SetStateAction<ProductCartItem[]>>;
};

const CartContext = createContext<UserContextType>({
  activeBill: 0,
  setActiveBill: () => {},

  carts: [[], [], []],
  setCarts: () => {},

  cart: [],
  setCart: () => {},
});

export default CartContext;