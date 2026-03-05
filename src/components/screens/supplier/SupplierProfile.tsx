"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import orderBy from "lodash/orderBy";
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Toast } from "@/components/ui";
import { getSupplier } from "@/services/supplierService";
import { Product, Supplier, SupplierWithProducts } from "@/types/prisma-types";
import { SortDirection } from "@/types/common-types";

type SortColumn = {
  path: keyof Product | "category_name";
  order: SortDirection;
};

const productColumns: {
  key: keyof Product | "product_barcode";
  label: string;
  path?: SortColumn["path"];
  sortable?: boolean;
  align?: "left" | "right";
}[] = [
  { key: "product_name", label: "Name", path: "product_name", sortable: true },
  {
    key: "product_barcode",
    label: "Barcode",
    path: "product_barcode",
    sortable: true,
  },
];

const SupplierProfile = () => {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const supplierId = params?.id ?? "";
  const [supplier, setSupplier] = useState<SupplierWithProducts | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sortColumn, setSortColumn] = useState<SortColumn>({
    path: "product_name",
    order: "asc",
  });

  useEffect(() => {
    if (!supplierId) {
      router.back();
      return;
    }

    const loadSupplier = async () => {
      try {
        setIsLoading(true);
        const { data } = await getSupplier({ supplier_id: supplierId });
        setSupplier(data ?? null);
      } catch (error) {
        console.error("Failed to load supplier products", error);
        Toast.error("Unable to load products for this supplier.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadSupplier();
  }, [router, supplierId]);

  const sortedProducts = useMemo(
    () => orderBy(supplier?.product, [sortColumn.path as string], [sortColumn.order]),
    [supplier, sortColumn]
  );

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

  const renderSortIcon = (column: (typeof productColumns)[number]) => {
    if (!column.sortable || !column.path) return null;
    if (sortColumn.path !== column.path) {
      return <ArrowUpDown className="h-3.5 w-3.5" />;
    }
    return sortColumn.order === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />;
  };

  const getSupplierField = (...keys: (keyof Supplier | string)[]) => {
    if (!supplier) return undefined;
    for (const key of keys) {
      const value = supplier[key as keyof Supplier];
      if (value !== undefined && value !== null && value !== "") {
        return value;
      }
    }
    return undefined;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading supplier…
      </div>
    );
  }

  if (!supplier) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-2 border-b border-border md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Supplier Profile</CardTitle>
            <p className="text-sm text-muted-foreground">Detailed information for the selected supplier.</p>
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Supplier Name</p>
              <p className="text-base font-medium">
                {String(getSupplierField("supplier_name", "contact_person", "name") ?? "Unnamed Supplier")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p>{String(getSupplierField("supplier_email", "email") ?? "Not provided")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Contact</p>
              <p>
                {String(getSupplierField("supplier_phone", "supplier_contact", "contact_number") ?? "Not provided")}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p>{String(getSupplierField("supplier_address", "address") ?? "Not provided")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Supplier ID</p>
              <p>{String(getSupplierField("supplier_id", "id") ?? "Not available")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-2 border-b border-border md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Products ({sortedProducts.length})</CardTitle>
            <p className="text-sm text-muted-foreground">Products currently associated with this supplier.</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  {productColumns.map((column) => (
                    <TableHead
                      key={column.key}
                      className={column.sortable ? "cursor-pointer" : undefined}
                      onClick={() => column.sortable && column.path && handleSort(column.path)}
                    >
                      <span className="inline-flex items-center gap-1">
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
                    <TableCell colSpan={productColumns.length} className="py-10 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Loading products…
                      </div>
                    </TableCell>
                  </TableRow>
                ) : sortedProducts.length > 0 ? (
                  sortedProducts.map((product, index) => (
                    <TableRow key={String(product.product_id ?? index)}>
                      <TableCell className="font-medium">{product.product_name ?? "Unnamed"}</TableCell>
                      <TableCell>{product.product_barcode ?? "—"}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={productColumns.length} className="py-10 text-center text-muted-foreground">
                      No products found for this supplier.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupplierProfile;
