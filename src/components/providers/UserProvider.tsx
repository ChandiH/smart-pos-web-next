"use client";

import UserContext, { UserCredentials } from "@/context/UserContext";
import { decodeJWT } from "@/services/authenticationService";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserCredentials | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    // Store the current page's pathname in session storage.
    if (pathname !== "/login")
      sessionStorage.setItem("lastVisitedPage", pathname);
  }, [pathname]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        setCurrentUser(decodeJWT(token) as UserCredentials);
      } catch (error) {
        console.error("Failed to decode token", error);
        localStorage.removeItem("token");
        setCurrentUser(null);
      }
    }

    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setCurrentUser(null);
  };

  return (
    <UserContext.Provider
      value={{ loading, currentUser, setCurrentUser, handleLogout }}
    >
      {children}
    </UserContext.Provider>
  );
}
