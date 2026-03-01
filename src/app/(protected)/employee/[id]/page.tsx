import React from "react";
import EmployeeForm from "@/components/screens/employee/EmployeeForm";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-3xl">
        <EmployeeForm />
      </div>
    </div>
  );
}
