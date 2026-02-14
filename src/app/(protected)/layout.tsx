"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { usePathname } from "next/navigation";

import AccessFrame from "@/components/accessFrame";
import { Navbar } from "@/components/ui/composite";

type ProtectedLayoutProps = {
  children: ReactNode;
};

type AccessRule = {
  pattern: RegExp;
  accessLevel: string;
};

const accessRules: AccessRule[] = [
  { pattern: /^\/dashboard(?:\/|$)/, accessLevel: "report:view" },
  { pattern: /^\/sale(?:\/|$)/, accessLevel: "cashier:view" },
  { pattern: /^\/inventory\/catalog(?:\/|$)/, accessLevel: "inventory:view" },
  { pattern: /^\/inventory\/update(?:\/|$)/, accessLevel: "inventory:manage" },
  { pattern: /^\/inventory\/categories(?:\/|$)/, accessLevel: "inventory:manage" },
  { pattern: /^\/inventory\/[^/]+(?:\/|$)/, accessLevel: "inventory:manage" },
  { pattern: /^\/inventory(?:\/|$)/, accessLevel: "inventory:view" },
  { pattern: /^\/customers\/[^/]+(?:\/|$)/, accessLevel: "customers:manage" },
  { pattern: /^\/customers(?:\/|$)/, accessLevel: "customers:view" },
  { pattern: /^\/suppliers\/[^/]+(?:\/|$)/, accessLevel: "suppliers:manage" },
  { pattern: /^\/suppliers(?:\/|$)/, accessLevel: "suppliers:view" },
  { pattern: /^\/employee\/roles(?:\/|$)/, accessLevel: "roles:manage" },
  { pattern: /^\/employee\/working(?:\/|$)/, accessLevel: "employee:view" },
  { pattern: /^\/employee\/profile(?:\/|$)/, accessLevel: "employee:manage" },
  { pattern: /^\/employee\/[^/]+(?:\/|$)/, accessLevel: "employee:manage" },
  { pattern: /^\/employee(?:\/|$)/, accessLevel: "employee:view" },
  { pattern: /^\/config(?:\/|$)/, accessLevel: "configuration:manage" },
  { pattern: /^\/branch\/[^/]+(?:\/|$)/, accessLevel: "branch:view" },
  { pattern: /^\/branch(?:\/|$)/, accessLevel: "branch:manage" },
  { pattern: /^\/user-profile(?:\/|$)/, accessLevel: "profile:view" },
];

const resolveAccessLevel = (pathname: string | null) => {
  if (!pathname) {
    return undefined;
  }
  return accessRules.find((rule) => rule.pattern.test(pathname))?.accessLevel;
};

const ProtectedLayout = ({ children }: ProtectedLayoutProps) => {
  const pathname = usePathname();
  const accessLevel = useMemo(
    () => resolveAccessLevel(pathname),
    [pathname]
  );

  return (
    <AccessFrame accessLevel={accessLevel}>
      <Navbar />
      {children}
    </AccessFrame>
  );
};

export default ProtectedLayout;
