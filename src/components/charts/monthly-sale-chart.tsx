"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Spinner } from "@/components/ui/spinner";
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { getMonthlySale } from "@/services/reportService";
import type { Identifier } from "@/services/types";

type MonthlySaleApiItem = {
  day?: string;
  total_sales?: number | string;
};

type SeriesDescriptor = {
  key: string;
  label: string;
  color: string;
};

type ChartRow = {
  day: number;
  [key: string]: number | string;
};

const DEFAULT_COLORS = [
  "hsl(217.2 91.2% 59.8%)",
  "hsl(142.1 70.6% 45.3%)",
  "hsl(346.8 77.2% 49.8%)",
];

const DAYS_IN_MONTH = 31;

type MonthlySaleChartProps = {
  branchId?: Identifier | null;
  height?: number;
};

const normaliseMonthlyData = (items: MonthlySaleApiItem[]): number[] => {
  const values = Array.from({ length: DAYS_IN_MONTH }, () => 0);

  items.forEach((item) => {
    if (!item) {
      return;
    }

    const dayString =
      typeof item.day === "string" && item.day.length >= 10
        ? item.day.slice(8, 10)
        : null;
    const dayIndex = dayString ? Number.parseInt(dayString, 10) - 1 : -1;

    if (!Number.isFinite(dayIndex) || dayIndex < 0 || dayIndex >= DAYS_IN_MONTH) {
      return;
    }

    const salesValue =
      typeof item.total_sales === "number"
        ? item.total_sales
        : Number.parseFloat(item.total_sales ?? "0");

    values[dayIndex] = Number.isFinite(salesValue) ? salesValue : 0;
  });

  return values;
};

const createMonthMeta = (offset: number) => {
  const current = new Date();
  const date = new Date(current.getFullYear(), current.getMonth() - offset, 1);

  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  const key = `month_${year}_${month.toString().padStart(2, "0")}`;
  const apiValue = `${year}-${month.toString().padStart(2, "0")}`;
  const label = date.toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });

  return { key, label, apiValue };
};

export const MonthlySaleChart = ({
  branchId,
  height = 320,
}: MonthlySaleChartProps) => {
  const [series, setSeries] = React.useState<SeriesDescriptor[]>([]);
  const [chartData, setChartData] = React.useState<ChartRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (branchId === null || branchId === undefined) {
      return;
    }

    let ignore = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const monthDescriptors = Array.from({ length: 3 }, (_, index) => {
          const base = createMonthMeta(index);
          return {
            ...base,
            color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
          };
        });

        const monthResponses = await Promise.all(
          monthDescriptors.map(async ({ apiValue }) => {
            try {
              const { data } = await getMonthlySale(apiValue, branchId);
              if (Array.isArray(data)) {
                return data as MonthlySaleApiItem[];
              }
              if ("data" in (data as Record<string, unknown>)) {
                const nested = (data as { data?: unknown }).data;
                return Array.isArray(nested)
                  ? (nested as MonthlySaleApiItem[])
                  : [];
              }
              return [];
            } catch (err) {
              console.error("Failed to fetch monthly sale data", err);
              return [];
            }
          })
        );

        const chartRows = Array.from({ length: DAYS_IN_MONTH }, (_, index) => ({
          day: index + 1,
        })) as ChartRow[];

        monthDescriptors.forEach(({ key }, monthIndex) => {
          const values = normaliseMonthlyData(monthResponses[monthIndex] ?? []);
          values.forEach((value, dayIndex) => {
            chartRows[dayIndex][key] = value;
          });
        });

        if (!ignore) {
          setSeries(
            monthDescriptors.map(({ key, label, color }) => ({
              key,
              label,
              color,
            }))
          );
          setChartData(chartRows);
        }
      } catch (err) {
        console.error("Unable to load monthly sales chart", err);
        if (!ignore) {
          setError("Unable to load monthly sales chart data.");
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
  }, [branchId]);

  const chartConfig = React.useMemo<ChartConfig>(() => {
    return series.reduce<ChartConfig>((acc, { key, label, color }) => {
      acc[key] = { label, color };
      return acc;
    }, {});
  }, [series]);

  if (branchId === null || branchId === undefined) {
    return (
      <ChartContainer config={{}}>
        <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
          Select a branch to preview sales data.
        </div>
      </ChartContainer>
    );
  }

  if (loading) {
    return (
      <ChartContainer config={chartConfig}>
        <div className="flex h-[200px] items-center justify-center">
          <Spinner className="h-6 w-6" />
        </div>
      </ChartContainer>
    );
  }

  if (error) {
    return (
      <ChartContainer config={chartConfig}>
        <div className="flex h-[200px] items-center justify-center text-sm text-destructive">
          {error}
        </div>
      </ChartContainer>
    );
  }

  if (!chartData.length || !series.length) {
    return (
      <ChartContainer config={chartConfig}>
        <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
          No sales data available for the selected branch.
        </div>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer config={chartConfig}>
      <div className="text-sm font-medium text-muted-foreground">
        Daily sales trend over the last three months
      </div>
      <div className="w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ left: 16, right: 16, top: 16 }}>
            <defs>
              {series.map(({ key, color }) => (
                <linearGradient
                  key={key}
                  id={`fill-${key}`}
                  x1="0"
                  x2="0"
                  y1="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `${value}`}
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
              cursor={{ strokeDasharray: "4 4" }}
              content={
                <ChartTooltipContent config={chartConfig} />
              }
            />
            <Legend />
            {series.map(({ key, color, label }) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                name={label}
                stroke={color}
                strokeWidth={2}
                fill={`url(#fill-${key})`}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
};

export default MonthlySaleChart;
