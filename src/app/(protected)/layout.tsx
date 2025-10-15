"use client";

import type { ReactNode } from "react";

import AccessFrame from "@/components/accessFrame";

type ProtectedLayoutProps = {
  children: ReactNode;
};

const ProtectedLayout = ({ children }: ProtectedLayoutProps) => {
  return <AccessFrame>{children}</AccessFrame>;
};

export default ProtectedLayout;
