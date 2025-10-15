"use client";

import { useContext, useEffect, useMemo } from "react";

import UserContext from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { accessList } from "@/services/authorizationService";
import type { AccessPermission } from "@/services/types";
import { useRouter } from "next/navigation";
import { Spinner } from "./ui";

type UserWithAccess = {
  user_access?: number[];
};

type AccessFrameProps = {
  accessLevel?: string | string[];
  children: React.ReactNode;
  onDenied?: () => void;
  message?: string;
};

const DEFAULT_MESSAGE =
  "You don't have permission to view this page. Please contact your branch manager for assistance.";

const findAccessByName = (
  accessName: string,
  permissions: AccessPermission[]
) => permissions.find((item) => item.access_name === accessName);

const AccessFrame = ({
  accessLevel,
  children,
  onDenied,
  message = DEFAULT_MESSAGE,
}: AccessFrameProps) => {
  const { loading, currentUser } = useContext(UserContext);
  const router = useRouter();

  const hasAccess = useMemo(() => {
    if (loading) {
      return null;
    }

    if (
      !accessLevel ||
      (Array.isArray(accessLevel) && accessLevel.length === 0)
    ) {
      return true;
    }

    const userAccess = (currentUser as UserWithAccess | null)?.user_access;
    if (!Array.isArray(userAccess)) {
      return false;
    }

    const requiredLevels = Array.isArray(accessLevel)
      ? accessLevel
      : [accessLevel];

    return requiredLevels.some((level) => {
      const permission = findAccessByName(level, accessList());
      if (!permission) {
        return false;
      }
      return userAccess.includes(permission.access_type_id);
    });
  }, [accessLevel, currentUser, loading]);

  useEffect(() => {
    if (hasAccess === false) {
      onDenied?.();
    }
  }, [hasAccess, onDenied]);

  useEffect(() => {
    if (!loading && !currentUser) {
      router.replace("/login");
    }
  }, [loading, currentUser, router]);

  if (loading || hasAccess === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="relative isolate">
        <div
          aria-hidden="true"
          className="pointer-events-none select-none blur-sm"
        >
          {children ?? (
            <div className="flex min-h-[240px] items-center justify-center bg-muted/40">
              <span className="text-sm text-muted-foreground">
                Restricted content
              </span>
            </div>
          )}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 px-6 py-10 text-center backdrop-blur">
          <div className="max-w-md space-y-4 rounded-lg border border-border bg-background/95 p-6 shadow-lg">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Access Restricted</h2>
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
            {onDenied && (
              <Button variant="outline" onClick={onDenied} className="mt-2">
                Go Back
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AccessFrame;
