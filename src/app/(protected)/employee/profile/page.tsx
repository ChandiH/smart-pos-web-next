import React from "react";
import EmployeeProfile from "@/components/screens/employee/EmployeeProfile";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-5xl">
        <EmployeeProfile />
      </div>
    </div>
  );
}
