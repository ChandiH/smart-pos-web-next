"use client";

import * as React from "react";
import type { TooltipProps } from "recharts";
import { cn } from "@/lib/utils";

export type ChartConfig<T extends string = string> = Record<
  T,
  {
    label: string;
    color?: string;
  }
>;

type ChartContainerProps<T extends string = string> =
  React.HTMLAttributes<HTMLDivElement> & {
    config: ChartConfig<T>;
  };

export const ChartContainer = React.forwardRef<
  HTMLDivElement,
  ChartContainerProps<string>
>(({ className, config, style, children, ...props }, ref) => {
  const cssVariables = React.useMemo(() => {
    return Object.entries(config).reduce<React.CSSProperties>(
      (acc, [key, value]) => {
        if (!value?.color) {
          return acc;
        }

        return {
          ...acc,
          [`--chart-${key}`]: value.color,
        };
      },
      {}
    );
  }, [config]);

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-4 rounded-lg border bg-card p-4 shadow-sm",
        className
      )}
      style={{ ...cssVariables, ...style }}
      {...props}
    >
      {children}
    </div>
  );
});
ChartContainer.displayName = "ChartContainer";

export type ChartTooltipContentProps<T extends string = string> = Omit<
  TooltipProps<number, T>,
  "content"
> & {
  indicator?: "dot" | "line" | "square";
  hideLabel?: boolean;
  config?: ChartConfig<T>;
  className?: string;
};

export function ChartTooltipContent<T extends string = string>({
  active,
  payload,
  label,
  indicator = "dot",
  hideLabel,
  config,
  className,
}: ChartTooltipContentProps<T>) {
  if (!active || !payload?.length) {
    return null;
  }

  const items = payload.filter(
    (item) => item.value !== undefined && item.value !== null
  );

  if (items.length === 0) {
    return null;
  }

  const getDisplayLabel = (dataKey?: string | number) => {
    if (!dataKey) {
      return undefined;
    }

    const key = String(dataKey) as T;
    return config?.[key]?.label ?? items.find((item) => item.dataKey === key)?.name;
  };

  return (
    <div
      className={cn(
        "min-w-[160px] space-y-2 rounded-md border bg-background p-3 text-sm shadow-md",
        className
      )}
    >
      {!hideLabel && label !== undefined && (
        <div className="font-medium text-foreground">{label}</div>
      )}
      <div className="space-y-2">
        {items.map((item) => {
          const key = String(item.dataKey ?? "") as T;
          const color = item.color ?? `var(--chart-${key})`;
          const displayLabel =
            item.name ?? getDisplayLabel(item.dataKey) ?? item.dataKey;

          return (
            <div
              key={key}
              className="flex items-center justify-between gap-2 text-xs text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                {indicator === "dot" && (
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                )}
                {indicator === "square" && (
                  <span
                    className="h-2 w-2 rounded-sm"
                    style={{ backgroundColor: color }}
                  />
                )}
                {indicator === "line" && (
                  <span
                    className="h-[2px] w-3 rounded-sm"
                    style={{ backgroundColor: color }}
                  />
                )}
                <span className="truncate">{displayLabel}</span>
              </div>
              <span className="font-medium text-foreground">
                {typeof item.value === "number"
                  ? item.value.toLocaleString()
                  : item.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { Tooltip as ChartTooltip } from "recharts";
