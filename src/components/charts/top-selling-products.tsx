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
import { getTopSellingProducts } from "@/services/reportService";

type ProductSalesRecord = {
  product_name?: string;
  current_month_count?: number | string;
  last_month_count?: number | string;
};

type ChartDatum = {
  product: string;
  current: number;
  previous: number;
};

type TopSellingProductsProps = {
  height?: number;
};

const COLORS: ChartConfig<"current" | "previous"> = {
  current: {
    label: "Current Month",
    color: "hsl(221.2 83.2% 53.3%)",
  },
  previous: {
    label: "Previous Month",
    color: "hsl(142.1 70.6% 45.3%)",
  },
};

const parseValue = (value: number | string | undefined) => {
  if (typeof value === "number") {
    return value;
  }

  const parsed = Number.parseFloat(value ?? "0");
  return Number.isFinite(parsed) ? parsed : 0;
};

export const TopSellingProducts = ({
  height = 280,
}: TopSellingProductsProps) => {
  const [data, setData] = React.useState<ChartDatum[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let ignore = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data } = await getTopSellingProducts();

        const payload = Array.isArray(data)
          ? data
          : Array.isArray((data as { data?: unknown })?.data)
          ? ((data as { data?: unknown }).data as unknown[])
          : [];

        const transformed = (payload as ProductSalesRecord[]).map((item) => ({
          product: item.product_name ?? "Unknown",
          current: parseValue(item.current_month_count),
          previous: parseValue(item.last_month_count),
        }));

        if (!ignore) {
          setData(transformed);
        }
      } catch (err) {
        console.error("Failed to fetch top selling products", err);
        if (!ignore) {
          setError("Unable to load top selling products.");
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
  }, []);

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
          No product performance data available.
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
            layout="vertical"
            margin={{ left: 0, right: 12, top: 12, bottom: 12 }}
            barGap={16}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) =>
                Number(value).toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })
              }
            />
            <YAxis
              type="category"
              dataKey="product"
              width={160}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.15 }}
              content={<ChartTooltipContent config={COLORS} />}
            />
            <Legend />
            <Bar
              dataKey="previous"
              name={COLORS.previous.label}
              fill="var(--chart-previous)"
              radius={[0, 6, 6, 0]}
            />
            <Bar
              dataKey="current"
              name={COLORS.current.label}
              fill="var(--chart-current)"
              radius={[0, 6, 6, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
};

export default TopSellingProducts;
