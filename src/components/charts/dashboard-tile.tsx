"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type DashboardTileProps = {
  label: string;
  value?: number | null;
  icon?: React.ReactNode;
  prefix?: string;
  decimals?: number;
  helpText?: string;
};

const numberFormatter = (value: number, decimals = 0) =>
  new Intl.NumberFormat(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);

export const DashboardTile = ({
  label,
  value = 0,
  icon,
  prefix = "",
  decimals = 0,
  helpText,
}: DashboardTileProps) => {
  const content = React.useMemo(() => {
    if (value === null || Number.isNaN(value)) {
      return "—";
    }

    return `${prefix}${numberFormatter(value, decimals)}`;
  }, [decimals, prefix, value]);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        {icon ? (
          <span className="text-muted-foreground [&>svg]:h-6 [&>svg]:w-6">
            {icon}
          </span>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="text-2xl font-semibold tracking-tight">{content}</div>
        {helpText ? (
          <p className="text-xs text-muted-foreground">{helpText}</p>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default DashboardTile;
