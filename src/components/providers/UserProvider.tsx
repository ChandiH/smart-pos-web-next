"use client";

import UserContext from "@/context/UserContext";
import { decodeJWT } from "@/services/authenticationService";
import { JwtPayload } from "jwt-decode";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<JwtPayload | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    // Store the current page's pathname in session storage.
    if (pathname !== "/login")
      sessionStorage.setItem("lastVisitedPage", pathname);
  }, [pathname]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setCurrentUser(decodeJWT(token));
  }, []);

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser }}>
      {children}
    </UserContext.Provider>
  );
}
