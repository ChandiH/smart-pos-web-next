"use client";

import * as React from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getSalesHistoryToday } from "@/services/reportService";
import type { Identifier } from "@/services/types";

type SaleRecord = {
  order_id?: string | number;
  customer?: string;
  cashier_name?: string;
  payment_method?: string;
  created_time?: string;
  total?: number | string;
  total_quantity?: number | string;
  [key: string]: unknown;
};

type SortColumn =
  | "order_id"
  | "customer"
  | "cashier_name"
  | "payment_method"
  | "created_time"
  | "total"
  | "total_quantity";

type SortState = {
  column: SortColumn;
  direction: "asc" | "desc";
};

type SaleHistoryTodayProps = {
  branchId?: Identifier | null;
  pageSize?: number;
};

const numberFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatCurrency = (value: number | string | undefined) => {
  if (value === null || value === undefined) {
    return "—";
  }

  const numeric =
    typeof value === "number" ? value : Number.parseFloat(String(value));

  if (!Number.isFinite(numeric)) {
    return "—";
  }

  return `Rs ${numberFormatter.format(numeric)}`;
};

const formatQuantity = (value: number | string | undefined) => {
  if (value === null || value === undefined) {
    return "—";
  }

  const numeric =
    typeof value === "number" ? value : Number.parseFloat(String(value));

  if (!Number.isFinite(numeric)) {
    return "—";
  }

  return numeric.toLocaleString();
};

const getSortValue = (record: SaleRecord, column: SortColumn) => {
  const value = record[column];

  if (column === "total" || column === "total_quantity") {
    const numeric =
      typeof value === "number" ? value : Number.parseFloat(String(value));
    return Number.isFinite(numeric) ? numeric : 0;
  }

  if (column === "created_time") {
    const timestamp = Date.parse(String(value ?? ""));
    return Number.isFinite(timestamp) ? timestamp : String(value ?? "");
  }

  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "number") {
    return value;
  }

  return String(value);
};

const paginate = <T,>(items: T[], page: number, pageSize: number) => {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
};

export const SaleHistoryToday = ({
  branchId,
  pageSize = 5,
}: SaleHistoryTodayProps) => {
  const [data, setData] = React.useState<SaleRecord[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [sort, setSort] = React.useState<SortState>({
    column: "created_time",
    direction: "desc",
  });

  React.useEffect(() => {
    if (branchId === null || branchId === undefined) {
      return;
    }

    let ignore = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data } = await getSalesHistoryToday(branchId);
        const payload = Array.isArray(data)
          ? data
          : Array.isArray((data as { data?: unknown })?.data)
          ? ((data as { data?: unknown }).data as unknown[])
          : [];

        if (!ignore) {
          setData(payload as SaleRecord[]);
          setPage(1);
        }
      } catch (err) {
        console.error("Failed to fetch sales history for today", err);
        if (!ignore) {
          setError("Unable to load today's sales history.");
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
  }, [branchId]);

  const sortedData = React.useMemo(() => {
    const items = [...data];

    items.sort((a, b) => {
      const valueA = getSortValue(a, sort.column);
      const valueB = getSortValue(b, sort.column);

      if (typeof valueA === "number" && typeof valueB === "number") {
        return sort.direction === "asc" ? valueA - valueB : valueB - valueA;
      }

      const stringA = String(valueA);
      const stringB = String(valueB);
      return sort.direction === "asc"
        ? stringA.localeCompare(stringB)
        : stringB.localeCompare(stringA);
    });

    return items;
  }, [data, sort]);

  const pagedData = React.useMemo(
    () => paginate(sortedData, page, pageSize),
    [page, pageSize, sortedData]
  );

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const start = sortedData.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, sortedData.length);

  const handleSort = (column: SortColumn) => {
    setSort((current) => {
      if (current.column === column) {
        return {
          column,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }

      return { column, direction: "asc" };
    });
  };

  const handlePageChange = (nextPage: number) => {
    setPage(Math.min(Math.max(nextPage, 1), totalPages));
  };

  if (branchId === null || branchId === undefined) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-lg border bg-card p-6 text-sm text-muted-foreground">
        Select a branch to review today&apos;s sales activity.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-lg border bg-card p-6">
        <Spinner className="h-5 w-5" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-lg border bg-card p-6 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-lg border bg-card p-6 text-sm text-muted-foreground">
        There are no sales recorded for today.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Total sales today: {data.length}</span>
        <span>
          Showing {start}-{end} of {sortedData.length}
        </span>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              role="button"
              className="cursor-pointer"
              onClick={() => handleSort("order_id")}
            >
              Order ID
            </TableHead>
            <TableHead
              role="button"
              className="cursor-pointer"
              onClick={() => handleSort("customer")}
            >
              Customer
            </TableHead>
            <TableHead
              role="button"
              className="cursor-pointer"
              onClick={() => handleSort("cashier_name")}
            >
              Cashier
            </TableHead>
            <TableHead
              role="button"
              className="cursor-pointer"
              onClick={() => handleSort("payment_method")}
            >
              Payment Method
            </TableHead>
            <TableHead
              role="button"
              className="cursor-pointer"
              onClick={() => handleSort("created_time")}
            >
              Time
            </TableHead>
            <TableHead
              role="button"
              className="cursor-pointer text-right"
              onClick={() => handleSort("total")}
            >
              Total (Rs.)
            </TableHead>
            <TableHead
              role="button"
              className="cursor-pointer text-right"
              onClick={() => handleSort("total_quantity")}
            >
              Quantity
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagedData.map((record, index) => (
            <TableRow
              key={
                record.order_id !== undefined && record.order_id !== null
                  ? String(record.order_id)
                  : `${record.created_time ?? "row"}-${index}`
              }
            >
              <TableCell className="font-medium">
                {record.order_id ?? "—"}
              </TableCell>
              <TableCell>{record.customer ?? "—"}</TableCell>
              <TableCell>{record.cashier_name ?? "—"}</TableCell>
              <TableCell>{record.payment_method ?? "—"}</TableCell>
              <TableCell>{record.created_time ?? "—"}</TableCell>
              <TableCell className="text-right">
                {formatCurrency(record.total)}
              </TableCell>
              <TableCell className="text-right">
                {formatQuantity(record.total_quantity)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground">
          Page {page} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => handlePageChange(page - 1)}
          >
            Previous
          </Button>
          {Array.from({ length: totalPages }, (_, index) => {
            const pageNumber = index + 1;
            return (
              <Button
                key={pageNumber}
                type="button"
                size="sm"
                variant={pageNumber === page ? "default" : "outline"}
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber}
              </Button>
            );
          })}
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => handlePageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SaleHistoryToday;
