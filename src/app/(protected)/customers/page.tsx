import React from "react";
import Customers from "@/components/screens/customer/Customers";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-6xl">
        <Customers />
      </div>
    </div>
  );
}
