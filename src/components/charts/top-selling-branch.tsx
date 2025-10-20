"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Spinner } from "@/components/ui/spinner";
import { getTopBranches } from "@/services/reportService";

type BranchSalesRecord = {
  branch_name?: string;
  current_month_sales?: number | string;
  previous_month_sales?: number | string;
};

type TopSellingBranchProps = {
  targetMonth?: string;
  height?: number;
};

type ChartDatum = {
  branch: string;
  current: number;
  previous: number;
};

const COLORS: ChartConfig<"current" | "previous"> = {
  current: {
    label: "Current Month",
    color: "hsl(221.2 83.2% 53.3%)",
  },
  previous: {
    label: "Previous Month",
    color: "hsl(25 95% 53%)",
  },
};

const parseValue = (value: number | string | undefined) => {
  if (typeof value === "number") {
    return value;
  }

  const parsed = Number.parseFloat(value ?? "0");
  return Number.isFinite(parsed) ? parsed : 0;
};

export const TopSellingBranch = ({
  targetMonth,
  height = 280,
}: TopSellingBranchProps) => {
  const [data, setData] = React.useState<ChartDatum[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!targetMonth) {
      return;
    }

    let ignore = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data } = await getTopBranches(targetMonth);
        const payload = Array.isArray(data)
          ? data
          : Array.isArray((data as { data?: unknown })?.data)
          ? ((data as { data?: unknown }).data as unknown[])
          : [];

        const transformed = (payload as BranchSalesRecord[]).map((item) => ({
          branch: item.branch_name ?? "Unknown",
          current: parseValue(item.current_month_sales),
          previous: parseValue(item.previous_month_sales),
        }));

        if (!ignore) {
          setData(transformed);
        }
      } catch (err) {
        console.error("Failed to fetch top selling branches", err);
        if (!ignore) {
          setError("Unable to load top selling branches.");
          setData([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      ignore = true;
    };
  }, [targetMonth]);

  if (!targetMonth) {
    return (
      <ChartContainer config={COLORS}>
        <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
          Select a month to view branch performance.
        </div>
      </ChartContainer>
    );
  }

  if (loading) {
    return (
      <ChartContainer config={COLORS}>
        <div className="flex h-[200px] items-center justify-center">
          <Spinner className="h-5 w-5" />
        </div>
      </ChartContainer>
    );
  }

  if (error) {
    return (
      <ChartContainer config={COLORS}>
        <div className="flex h-[200px] items-center justify-center text-sm text-destructive">
          {error}
        </div>
      </ChartContainer>
    );
  }

  if (!data.length) {
    return (
      <ChartContainer config={COLORS}>
        <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
          No branch performance data available.
        </div>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer config={COLORS}>
      <div className="w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 12, left: 12, right: 12, bottom: 12 }}
            barGap={12}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="branch"
              tickLine={false}
              axisLine={false}
              tickMargin={12}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) =>
                Number(value).toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })
              }
            />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.15 }}
              content={<ChartTooltipContent config={COLORS} />}
            />
            <Legend />
            <Bar
              dataKey="current"
              name={COLORS.current.label}
              fill="var(--chart-current)"
              radius={[6, 6, 0, 0]}
            />
            <Bar
              dataKey="previous"
              name={COLORS.previous.label}
              fill="var(--chart-previous)"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
};

export default TopSellingBranch;
