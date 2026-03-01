"use client";

import { CartProvider } from "./CartProvider";
import { UserProvider } from "./UserProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <UserProvider>{children}</UserProvider>
    </CartProvider>
  );
}
