import CashierSalePage from "@/components/screens/sale/cashierSalePage";
import React from "react";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-6xl">
        <CashierSalePage />
      </div>
    </div>
  );
}
