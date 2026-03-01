"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import orderBy from "lodash/orderBy";
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSuppliers } from "@/services/supplierService";
import { Toast } from "@/components/ui";
import { Supplier } from "@/types/prisma-types";

type SortDirection = "asc" | "desc";

type SortColumn = {
  path: keyof Supplier | "supplier_id";
  order: SortDirection;
};

type ColumnConfig = {
  key: keyof Supplier | "actions" | "supplier_id";
  label: string;
  path?: SortColumn["path"];
  align?: "left" | "right";
  sortable?: boolean;
};

const columns: ColumnConfig[] = [
  {
    key: "supplier_id",
    label: "Supplier ID",
    path: "supplier_id",
    sortable: true,
  },
  {
    key: "supplier_name",
    label: "Name",
    path: "supplier_name",
    sortable: true,
  },
  {
    key: "supplier_email",
    label: "Email",
    path: "supplier_email",
    sortable: true,
  },
  {
    key: "supplier_phone",
    label: "Contact",
    path: "supplier_phone",
    sortable: true,
  },
  { key: "supplier_address", label: "Address" },
];

const PAGE_SIZE = 30;

const Suppliers = () => {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn>({
    path: "supplier_name",
    order: "asc",
  });

  const fetchSuppliers = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await getSuppliers();
      if (error) {
        Toast.error(error.message || "Failed to fetch suppliers.");
        setSuppliers([]);
        return;
      }
      setSuppliers(data || []);
    } catch (error) {
      console.error("Failed to load suppliers", error);
      Toast.error("Unable to load suppliers. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSuppliers();
  }, [fetchSuppliers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredSuppliers = useMemo(() => {
    if (!searchQuery) return suppliers;
    const query = searchQuery.trim().toLowerCase();
    return suppliers.filter((supplier) => {
      const matchesName = supplier.supplier_name.toLowerCase().includes(query);
      const matchesId = supplier.supplier_id.toString().toLowerCase().startsWith(query);
      return Boolean(matchesName || matchesId);
    });
  }, [suppliers, searchQuery]);

  const sortedSuppliers = useMemo(
    () => orderBy(filteredSuppliers, [sortColumn.path as string], [sortColumn.order]),
    [filteredSuppliers, sortColumn]
  );

  const paginatedSuppliers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedSuppliers.slice(start, start + PAGE_SIZE);
  }, [sortedSuppliers, currentPage]);

  const totalPages = Math.max(1, Math.ceil(sortedSuppliers.length / PAGE_SIZE));

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

  const handleSelect = (supplier: Supplier) => {
    router.push(`/suppliers/profile/${supplier.supplier_id}`);
  };

  const handleAddSupplier = () => {
    router.push("/suppliers/new");
  };

  const renderSortIcon = (column: ColumnConfig) => {
    if (!column.sortable || !column.path) {
      return null;
    }

    if (sortColumn.path !== column.path) {
      return <ArrowUpDown className="h-3.5 w-3.5" />;
    }

    return sortColumn.order === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />;
  };

  const getSupplierField = (supplier: Supplier, ...keys: (keyof Supplier | string)[]) => {
    for (const key of keys) {
      if (key in supplier) {
        const value = supplier[key as keyof Supplier];
        if (value !== undefined && value !== null && value !== "") {
          return value;
        }
      }
    }
    return undefined;
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 border-b border-border sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg font-semibold">Suppliers</CardTitle>
          <p className="text-sm text-muted-foreground">Showing {sortedSuppliers.length} suppliers in the database.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search suppliers (name or ID)"
            className="w-full min-w-[220px]"
          />
          <Button onClick={handleAddSupplier}>
            <Plus className="mr-2 h-4 w-4" />
            Add Supplier
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={column.sortable ? "cursor-pointer" : undefined}
                    onClick={() => column.sortable && column.path && handleSort(column.path)}
                  >
                    <span className={`inline-flex items-center gap-1 ${column.align === "right" ? "justify-end" : ""}`}>
                      {column.label}
                      {renderSortIcon(column)}
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="py-10 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Loading suppliers…
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedSuppliers.length > 0 ? (
                paginatedSuppliers.map((supplier, index) => (
                  <TableRow
                    key={String(getSupplierField(supplier, "supplier_id", "id") ?? index)}
                    className="cursor-pointer hover:bg-muted/60"
                    onClick={() => handleSelect(supplier)}
                  >
                    <TableCell>{supplier.supplier_id ?? "—"}</TableCell>
                    <TableCell className="font-medium">
                      {String(getSupplierField(supplier, "supplier_name", "name", "contact_person") ?? "Unnamed")}
                    </TableCell>
                    <TableCell>
                      {String(getSupplierField(supplier, "supplier_email", "email") ?? "Not provided")}
                    </TableCell>
                    <TableCell>
                      {String(
                        getSupplierField(supplier, "supplier_phone", "contact_number", "supplier_contact") ??
                          "Not provided"
                      )}
                    </TableCell>
                    <TableCell>
                      {String(getSupplierField(supplier, "supplier_address", "address") ?? "Not provided")}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="py-10 text-center text-muted-foreground">
                    No suppliers found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {sortedSuppliers.length > PAGE_SIZE && (
          <PaginationControls currentPage={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
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

const PaginationControls = ({ currentPage, totalPages, onChange }: PaginationControlsProps) => {
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

export default Suppliers;
