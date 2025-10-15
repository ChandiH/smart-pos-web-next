/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext } from "react";

export type UserContextType = {
  cart: any[];
  setCart: (cart: any[]) => void;
};

const CartContext = createContext<UserContextType>({
  cart: [],
  setCart: () => {},
});

export default CartContext;
