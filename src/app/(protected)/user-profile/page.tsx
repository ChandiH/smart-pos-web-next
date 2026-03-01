import React from "react";
import UserProfile from "@/components/screens/user/UserProfile";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full p-6 justify-center">
      <div className="w-full">
        <UserProfile />
      </div>
    </div>
  );
}
