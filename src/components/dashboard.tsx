"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, Wallet, ShoppingCart } from "lucide-react";

import AccessFrame from "@/components/accessFrame";
import { DashboardTile } from "@/components/charts/dashboard-tile";
import { MonthlySaleChart } from "@/components/charts/monthly-sale-chart";
import { SaleHistoryToday } from "@/components/charts/sale-history-today";
import { TopSellingBranch } from "@/components/charts/top-selling-branch";
import { TopSellingProducts } from "@/components/charts/top-selling-products";
import UserContext from "@/context/UserContext";
import { getAllBranches } from "@/services/branchService";
import { getMonthlySummary, getThreeMonths } from "@/services/reportService";
import type { Branch } from "@/services/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type BranchOption = {
  value: string;
  label: string;
};

type MonthOption = {
  value: string;
  label: string;
};

type MonthlySummaryRecord = {
  net_sale?: number | string;
  gross_profit?: number | string;
  total_orders?: number | string;
};

const parseNumber = (value: number | string | undefined | null) => {
  if (typeof value === "number") {
    return value;
  }

  if (value === undefined || value === null) {
    return 0;
  }

  const numeric = Number.parseFloat(String(value));
  return Number.isFinite(numeric) ? numeric : 0;
};

const getCurrentMonthValue = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

export const Dashboard = () => {
  const router = useRouter();
  const { currentUser } = React.useContext(UserContext);

  const [branchOptions, setBranchOptions] = React.useState<BranchOption[]>([]);
  const [selectedBranch, setSelectedBranch] = React.useState<string>("");

  const [monthOptions, setMonthOptions] = React.useState<MonthOption[]>([]);
  const [selectedMonth, setSelectedMonth] = React.useState<string>(
    getCurrentMonthValue()
  );

  const [summary, setSummary] = React.useState<MonthlySummaryRecord | null>(
    null
  );

  React.useEffect(() => {
    if (
      currentUser?.branch_id !== undefined &&
      currentUser?.branch_id !== null
    ) {
      setSelectedBranch(String(currentUser.branch_id));
    }
  }, [currentUser?.branch_id]);

  React.useEffect(() => {
    let ignore = false;

    const load = async () => {
      try {
        const [branchResponse, summaryResponse, monthsResponse] =
          await Promise.all([
            getAllBranches(),
            getMonthlySummary(),
            getThreeMonths(),
          ]);

        if (ignore) {
          return;
        }

        // Branches
        const branches = Array.isArray(branchResponse.data)
          ? (branchResponse.data as Branch[])
          : [];
        const branchOptions = branches.map<BranchOption>((branch) => {
          const value = String(branch.branch_id ?? "");
          const label =
            branch.branch_name ??
            (branch as Record<string, unknown>)["branch_city"] ??
            `Branch ${value}`;
          return { value, label: String(label) };
        });
        setBranchOptions(branchOptions);

        if (!selectedBranch && branchOptions.length > 0) {
          setSelectedBranch(branchOptions[0].value);
        }

        // Monthly summary
        const summaryPayload = Array.isArray(summaryResponse.data)
          ? summaryResponse.data[0]
          : Array.isArray((summaryResponse.data as { data?: unknown })?.data)
          ? ((summaryResponse.data as { data?: unknown }).data as unknown[])[0]
          : summaryResponse.data;

        if (summaryPayload && typeof summaryPayload === "object") {
          setSummary(summaryPayload as MonthlySummaryRecord);
        }

        // Months
        const monthPayload = Array.isArray(monthsResponse.data)
          ? monthsResponse.data
          : Array.isArray((monthsResponse.data as { data?: unknown })?.data)
          ? (monthsResponse.data as { data?: unknown }).data
          : [];

        const options = (monthPayload as Array<Record<string, unknown>>)
          .map((item) => {
            const value =
              (item.month_value as string | undefined) ??
              (item.month_name as string | undefined);
            const label =
              (item.month_name as string | undefined) ??
              (item.month_value as string | undefined) ??
              value;
            if (!value) {
              return null;
            }
            return { value, label: label ?? value };
          })
          .filter((option): option is MonthOption => !!option);

        if (options.length > 0) {
          setMonthOptions(options);
          if (!options.some((option) => option.value === selectedMonth)) {
            setSelectedMonth(options[0].value);
          }
        }
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      }
    };

    void load();

    return () => {
      ignore = true;
    };
  }, [selectedBranch, selectedMonth]);

  const grossSale = parseNumber(summary?.net_sale);
  const grossProfit = parseNumber(summary?.gross_profit);
  const totalOrders = parseNumber(summary?.total_orders);

  return (
    <AccessFrame accessLevel="report" onDenied={() => router.replace("/sale")}>
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DashboardTile
            label="Gross Sale"
            value={grossSale}
            decimals={2}
            prefix="Rs "
            icon={<TrendingUp className="h-6 w-6" />}
            helpText="Total invoiced amount for the month"
          />
          <DashboardTile
            label="Gross Profit"
            value={grossProfit}
            decimals={2}
            prefix="Rs "
            icon={<Wallet className="h-6 w-6" />}
            helpText="Profit after cost of goods sold"
          />
          <DashboardTile
            label="Total Orders"
            value={totalOrders}
            decimals={0}
            icon={<ShoppingCart className="h-6 w-6" />}
            helpText="Completed orders for the month"
          />
        </div>

        <div className="space-y-4 rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-semibold">Sales by Day</h3>
              <p className="text-sm text-muted-foreground">
                Compare the last three months of daily sales for a branch.
              </p>
            </div>
            {branchOptions.length > 0 && (
              <div className="flex flex-col gap-2 text-sm">
                <span className="text-xs font-medium uppercase text-muted-foreground">
                  Branch
                </span>
                <Select
                  value={selectedBranch}
                  onValueChange={setSelectedBranch}
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branchOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <MonthlySaleChart branchId={selectedBranch || null} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4 rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-base font-semibold">
                  Top Selling Branches
                </h3>
                <p className="text-sm text-muted-foreground">
                  Month-over-month performance by branch.
                </p>
              </div>
              {monthOptions.length > 0 && (
                <div className="flex flex-col gap-2 text-sm">
                  <span className="text-xs font-medium uppercase text-muted-foreground">
                    Month
                  </span>
                  <Select
                    value={selectedMonth}
                    onValueChange={setSelectedMonth}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {monthOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <TopSellingBranch targetMonth={selectedMonth} />
          </div>

          <div className="space-y-4 rounded-lg border bg-card p-4 shadow-sm">
            <div className="space-y-1">
              <h3 className="text-base font-semibold">Top Selling Products</h3>
              <p className="text-sm text-muted-foreground">
                Best performing products across all branches.
              </p>
            </div>
            <TopSellingProducts />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-semibold">
            Sales Today at {currentUser?.branch_name ?? "Branch"}
          </h3>
          <SaleHistoryToday branchId={currentUser?.branch_id ?? null} />
        </div>
      </div>
    </AccessFrame>
  );
};

export default Dashboard;
