import React from "react";
import ProductCatalog from "@/components/screens/inventory/ProductCatalog";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full p-6 justify-center">
      <div className="w-full">
        <ProductCatalog />
      </div>
    </div>
  );
}
