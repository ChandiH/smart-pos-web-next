import React from "react";
import Customers from "@/components/screens/customer/Customers";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full p-6 justify-center">
      <div className="w-full">
        <Customers />
      </div>
    </div>
  );
}
