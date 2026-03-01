import React from "react";
import CustomerForm from "@/components/screens/customer/CustomerForm";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-3xl">
        <CustomerForm />
      </div>
    </div>
  );
}
