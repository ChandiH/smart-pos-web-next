import SupplierProfile from "@/components/screens/supplier/SupplierProfile";
import React from "react";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-6xl">
        <SupplierProfile />
      </div>
    </div>
  );
}
