import React from "react";
import StockUpdateForm from "@/components/screens/inventory/StockUpdateForm";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full">
        <StockUpdateForm />
      </div>
    </div>
  );
}
