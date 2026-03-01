"use client";

import { useContext, useEffect, useMemo } from "react";

import UserContext from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { accessList } from "@/services/authorizationService";
import type { AccessPermission } from "@/services/types";
import { useRouter } from "next/navigation";
import { Spinner } from "./ui";

type UserWithAccess = {
  user_access?: number[] | string[];
  scopes?: string[];
  scope?: string | string[];
  permissions?: string[];
  access?: string[];
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

const normalizeScopes = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string") {
    return value.split(/[,\s]+/).filter(Boolean);
  }
  return [];
};

const getUserScopes = (user: UserWithAccess | null): string[] =>
  normalizeScopes(
    user?.scopes ?? user?.scope ?? user?.permissions ?? user?.access ?? user?.user_access
  );

const hasScope = (requiredScope: string, userScopes: string[]) => {
  if (userScopes.includes(requiredScope)) {
    return true;
  }

  const [page, action] = requiredScope.split(":");
  if (!page || !action) {
    return false;
  }

  return [
    `${page}:all`,
    `${page}:*`,
    `*:${action}`,
    "*:all",
  ].some((scope) => userScopes.includes(scope));
};

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

    const requiredLevels = Array.isArray(accessLevel)
      ? accessLevel
      : [accessLevel];

    const scopeRequirements = requiredLevels.filter((level) =>
      level.includes(":")
    );
    if (scopeRequirements.length > 0) {
      const userScopes = getUserScopes(currentUser as UserWithAccess | null);
      if (userScopes.length === 0) {
        return false;
      }
      return scopeRequirements.some((level) => hasScope(level, userScopes));
    }

    const userAccess = (currentUser as UserWithAccess | null)?.user_access;
    if (!Array.isArray(userAccess)) {
      return false;
    }

    return requiredLevels.some((level) => {
      const permission = findAccessByName(level, accessList());
      if (!permission) {
        return false;
      }
      if (typeof permission.access_type_id !== "number") {
        return false;
      }
      return (userAccess as (number | string)[]).includes(permission.access_type_id);
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
