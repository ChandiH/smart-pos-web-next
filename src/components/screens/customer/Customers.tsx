"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import orderBy from "lodash/orderBy";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Loader2,
  UserPlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCustomers } from "@/services/customerService";
import type { Customer } from "@/services/types";
import { Toast } from "@/components/ui";
import useBarcodeScanner from "@/hooks/useBarcodeScanner";

type SortDirection = "asc" | "desc";

type SortColumn = {
  path: keyof CustomerRow;
  order: SortDirection;
};

type CustomerRow = Customer & {
  customer_phone?: string | number;
  customer_email?: string;
  rewards_points?: number;
};

const PAGE_SIZE = 30;

const Customers = () => {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn>({
    path: "customer_name",
    order: "asc",
  });

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const { data } = await getCustomers();
      const payload = Array.isArray(data) ? (data as CustomerRow[]) : [];
      setCustomers(payload);
    } catch (error) {
      console.error("Failed to load customers", error);
      Toast.error("Unable to load customers. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchCustomers();
  }, []);

  useBarcodeScanner<CustomerRow>({
    enabled: customers.length > 0,
    items: customers,
    getBarcode: (item) => {
      const raw =
        item.customer_contact ?? item.customer_phone ?? item.customer_id;
      if (raw === undefined || raw === null) return undefined;
      if (typeof raw === "number") return String(raw);
      if (typeof raw === "string") return raw.trim();
      return undefined;
    },
    onScanSuccess: (_, scannedBarcode) => {
      const normalizedBarcode = scannedBarcode.trim();
      setSearchQuery(normalizedBarcode);
    },
    onScanFailure: (scannedBarcode) => {
      const normalizedBarcode = scannedBarcode.trim();
      setSearchQuery(normalizedBarcode);
      Toast.error("No customer matches the scanned barcode.");
    },
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customers;
    const query = searchQuery.trim().toLowerCase();
    return customers.filter((customer) => {
      const matchesName = customer.customer_name?.toLowerCase().includes(query);
      const matchesPhone = customer.customer_phone
        ?.toString()
        .toLowerCase()
        .includes(query);
      const matchesContact = customer.customer_contact
        ?.toString()
        .toLowerCase()
        .includes(query);
      return Boolean(matchesName || matchesPhone || matchesContact);
    });
  }, [customers, searchQuery]);

  const sortedCustomers = useMemo(
    () =>
      orderBy(
        filteredCustomers,
        [sortColumn.path as string],
        [sortColumn.order]
      ),
    [filteredCustomers, sortColumn]
  );

  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedCustomers.slice(start, start + PAGE_SIZE);
  }, [sortedCustomers, currentPage]);

  const totalPages = Math.max(1, Math.ceil(sortedCustomers.length / PAGE_SIZE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleSort = (path: SortColumn["path"]) => {
    setSortColumn((prev) => {
      if (prev.path === path) {
        return {
          path,
          order: prev.order === "asc" ? "desc" : "asc",
        };
      }
      return { path, order: "asc" };
    });
  };

  const renderSortIcon = (path: SortColumn["path"]) => {
    if (sortColumn.path !== path) {
      return <ArrowUpDown className="h-3.5 w-3.5" />;
    }
    return sortColumn.order === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5" />
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 border-b border-border sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg font-semibold">Customers</CardTitle>
          <p className="text-sm text-muted-foreground">
            Showing {sortedCustomers.length} customers in the database.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search customers (name or phone)"
            className="w-full min-w-[220px]"
          />
          <Button onClick={() => router.push("/customers/new")}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("customer_name")}
                >
                  <span className="inline-flex items-center gap-1">
                    Name
                    {renderSortIcon("customer_name")}
                  </span>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("customer_phone")}
                >
                  <span className="inline-flex items-center gap-1">
                    Contact
                    {renderSortIcon("customer_phone")}
                  </span>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("customer_email")}
                >
                  <span className="inline-flex items-center gap-1">
                    Email
                    {renderSortIcon("customer_email")}
                  </span>
                </TableHead>
                <TableHead
                  className="cursor-pointer text-right"
                  onClick={() => handleSort("rewards_points")}
                >
                  <span className="inline-flex items-center gap-1 justify-end">
                    Loyalty Points
                    {renderSortIcon("rewards_points")}
                  </span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-10 text-center text-muted-foreground"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Loading customers…
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedCustomers.length > 0 ? (
                paginatedCustomers.map((customer, index) => (
                  <TableRow
                    key={String(
                      customer.customer_id ??
                        `${customer.customer_email ?? "customer"}-${index}`
                    )}
                  >
                    <TableCell className="font-medium">
                      {customer.customer_name ?? "Unnamed"}
                    </TableCell>
                    <TableCell>
                      {customer.customer_phone ?? "Not provided"}
                    </TableCell>
                    <TableCell>
                      {customer.customer_email ?? "Not provided"}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(customer.rewards_points ?? 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No customers found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {sortedCustomers.length > PAGE_SIZE && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onChange={setCurrentPage}
          />
        )}
      </CardContent>
    </Card>
  );
};

type PaginationControlsProps = {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
};

const PaginationControls = ({
  currentPage,
  totalPages,
  onChange,
}: PaginationControlsProps) => {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <div className="flex items-center gap-1">
          {pages.map((page) => (
            <Button
              key={page}
              size="sm"
              variant={page === currentPage ? "default" : "outline"}
              onClick={() => onChange(page)}
            >
              {page}
            </Button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default Customers;
