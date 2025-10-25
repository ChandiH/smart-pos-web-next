import { Product, Product_Variant } from "@/types/prisma-types";
import { createContext, Dispatch, SetStateAction } from "react";

export type ProductCartItem = Product & {
  variant: Product_Variant;
  quantity: number;
};

export type UserContextType = {
  cart: ProductCartItem[];
  setCart: Dispatch<SetStateAction<ProductCartItem[]>>;
};

const CartContext = createContext<UserContextType>({
  cart: [],
  setCart: () => {},
});

export default CartContext;
