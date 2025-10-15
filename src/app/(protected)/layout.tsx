"use client";

import type { ReactNode } from "react";

import AccessFrame from "@/components/accessFrame";
import { Navbar } from "@/components/ui/composite";

type ProtectedLayoutProps = {
  children: ReactNode;
};

const ProtectedLayout = ({ children }: ProtectedLayoutProps) => {
  return (
    <AccessFrame>
      <Navbar />
      {children}
    </AccessFrame>
  );
};

export default ProtectedLayout;
