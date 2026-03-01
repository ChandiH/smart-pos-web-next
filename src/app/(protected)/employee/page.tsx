import React from "react";
import EmployeeList from "@/components/screens/employee/EmployeeList";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full p-6 justify-center">
      <div className="w-full">
        <EmployeeList />
      </div>
    </div>
  );
}
