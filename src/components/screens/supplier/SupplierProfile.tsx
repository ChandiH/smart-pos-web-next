"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import orderBy from "lodash/orderBy";
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Toast } from "@/components/ui";
import { getProductsBySupplier } from "@/services/productService";
import type { Product, Supplier, Identifier } from "@/services/types";
import { getImageUrl } from "@/services/imageHandler";

type SortDirection = "asc" | "desc";

type SupplierProfileState = Supplier & {
  supplier_name?: string;
  supplier_email?: string;
  supplier_phone?: string | number;
  supplier_address?: string;
  supplier_contact?: string;
  [key: string]: unknown;
};

type SupplierProduct = Product & {
  category_name?: string;
  product_image?: string[] | string;
  image?: string[] | string;
};

type SortColumn = {
  path: keyof SupplierProduct | "category_name";
  order: SortDirection;
};

const productColumns: {
  key: keyof SupplierProduct | "image";
  label: string;
  path?: SortColumn["path"];
  sortable?: boolean;
  align?: "left" | "right";
}[] = [
  { key: "image", label: "", align: "left" },
  { key: "product_name", label: "Name", path: "product_name", sortable: true },
  {
    key: "category_name",
    label: "Category",
    path: "category_name",
    sortable: true,
  },
  {
    key: "buying_price",
    label: "Buying Price",
    path: "buying_price",
    sortable: true,
  },
  {
    key: "product_barcode",
    label: "Barcode",
    path: "product_barcode",
    sortable: true,
  },
];

const SupplierProfile = () => {
  const router = useRouter();
  const [supplier, setSupplier] = useState<SupplierProfileState | null>(null);
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [sortColumn, setSortColumn] = useState<SortColumn>({
    path: "product_name",
    order: "asc",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadSupplier = () => {
      const storedSupplier = window.sessionStorage.getItem("selectedSupplier");
      if (!storedSupplier) {
        router.replace("/suppliers");
        setIsInitializing(false);
        return;
      }

      try {
        const parsedSupplier = JSON.parse(
          storedSupplier
        ) as SupplierProfileState;
        setSupplier(parsedSupplier);
      } catch (error) {
        console.error("Failed to parse supplier from session storage", error);
        router.replace("/suppliers");
      } finally {
        setIsInitializing(false);
      }
    };

    loadSupplier();
  }, [router]);

  useEffect(() => {
    const supplierId =
      supplier?.supplier_id ?? (supplier as Record<string, unknown>)?.id;
    if (!supplierId) {
      return;
    }

    const loadProducts = async () => {
      try {
        setIsLoadingProducts(true);
        const { data } = await getProductsBySupplier(supplierId as Identifier);
        setProducts(Array.isArray(data) ? (data as SupplierProduct[]) : []);
      } catch (error) {
        console.error("Failed to load supplier products", error);
        Toast.error("Unable to load products for this supplier.");
      } finally {
        setIsLoadingProducts(false);
      }
    };

    void loadProducts();
  }, [supplier]);

  const sortedProducts = useMemo(
    () => orderBy(products, [sortColumn.path as string], [sortColumn.order]),
    [products, sortColumn]
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
    return sortColumn.order === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5" />
    );
  };

  const getSupplierField = (
    ...keys: (keyof SupplierProfileState | string)[]
  ) => {
    if (!supplier) return undefined;
    for (const key of keys) {
      const value = (supplier as Record<string, unknown>)[key];
      if (value !== undefined && value !== null && value !== "") {
        return value;
      }
    }
    return undefined;
  };

  if (isInitializing) {
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
            <CardTitle className="text-lg font-semibold">
              Supplier Profile
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Detailed information for the selected supplier.
            </p>
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
                {String(
                  getSupplierField("supplier_name", "contact_person", "name") ??
                    "Unnamed Supplier"
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p>
                {String(
                  getSupplierField("supplier_email", "email") ?? "Not provided"
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Contact</p>
              <p>
                {String(
                  getSupplierField(
                    "supplier_phone",
                    "supplier_contact",
                    "contact_number"
                  ) ?? "Not provided"
                )}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p>
                {String(
                  getSupplierField("supplier_address", "address") ??
                    "Not provided"
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Supplier ID</p>
              <p>
                {String(
                  getSupplierField("supplier_id", "id") ?? "Not available"
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-2 border-b border-border md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">
              Products ({sortedProducts.length})
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Products currently associated with this supplier.
            </p>
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
                      onClick={() =>
                        column.sortable &&
                        column.path &&
                        handleSort(column.path)
                      }
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
                {isLoadingProducts ? (
                  <TableRow>
                    <TableCell
                      colSpan={productColumns.length}
                      className="py-10 text-center text-muted-foreground"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Loading products…
                      </div>
                    </TableCell>
                  </TableRow>
                ) : sortedProducts.length > 0 ? (
                  sortedProducts.map((product, index) => {
                    const imageSource = Array.isArray(product.product_image)
                      ? product.product_image[0]
                      : Array.isArray(product.image)
                      ? product.image[0]
                      : typeof product.product_image === "string"
                      ? product.product_image
                      : typeof product.image === "string"
                      ? product.image
                      : undefined;

                    return (
                      <TableRow key={String(product.product_id ?? index)}>
                        <TableCell className="w-[70px]">
                          <div className="relative h-10 w-10 overflow-hidden rounded-md border">
                            <Image
                              src={
                                imageSource
                                  ? getImageUrl(imageSource)
                                  : "https://placehold.co/80x80/png"
                              }
                              alt={product.product_name ?? "Product image"}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {product.product_name ?? "Unnamed"}
                        </TableCell>
                        <TableCell>{product.category_name ?? "—"}</TableCell>
                        <TableCell>
                          Rs. {Number(product.buying_price ?? 0).toFixed(2)}
                        </TableCell>
                        <TableCell>{product.product_barcode ?? "—"}</TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={productColumns.length}
                      className="py-10 text-center text-muted-foreground"
                    >
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
