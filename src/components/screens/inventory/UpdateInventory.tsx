"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import orderBy from "lodash/orderBy";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Loader2,
  PackagePlus,
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
import Image from "next/image";
import UserContext from "@/context/UserContext";
import { getInventoryByBranch } from "@/services/inventoryService";
import { getProducts } from "@/services/productService";
import { getImageUrl } from "@/services/imageHandler";
import type { InventoryItem, Product } from "@/services/types";
import { Toast } from "@/components/ui";
import useBarcodeScanner from "@/hooks/useBarcodeScanner";

type SortDirection = "asc" | "desc";

type SortColumn = {
  path: keyof InventoryProduct;
  order: SortDirection;
};

type InventoryProduct = Product & {
  quantity: number;
  updated_on?: string;
  reorder_level?: number;
};

type ExtendedUser = {
  branch_id?: number | string;
  branch_name?: string;
  [key: string]: unknown;
};

const PAGE_SIZE = 20;

const UpdateInventory = () => {
  const router = useRouter();
  const { currentUser } = useContext(UserContext);
  const user = (currentUser as ExtendedUser | null) ?? {};
  const branchId = user.branch_id;

  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [lowStock, setLowStock] = useState<InventoryProduct[]>([]);
  const [showLowStock, setShowLowStock] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn>({
    path: "product_name",
    order: "asc",
  });

  const checkLowStock = (product: InventoryProduct) => {
    const reorderLevel = Number(product.reorder_level ?? 0);
    const quantity = Number(product.quantity ?? 0);
    return quantity <= reorderLevel || quantity === 0;
  };

  const fetchData = async () => {
    if (!branchId) return;
    try {
      setIsLoading(true);
      const [{ data: inventory }, { data: productData }] = await Promise.all([
        getInventoryByBranch(branchId),
        getProducts(),
      ]);

      const inventoryList: InventoryItem[] = Array.isArray(inventory)
        ? (inventory as InventoryItem[])
        : [];
      const productList: Product[] = Array.isArray(productData)
        ? (productData as Product[])
        : [];

      const availableProducts = productList.filter(
        (product) => !product.removed
      );

      const combined = availableProducts.map((product) => {
        const match = inventoryList.find(
          (item) => item.product_id === product.product_id
        );

        return {
          ...product,
          quantity: Number(match?.quantity ?? 0),
          updated_on: match?.updated_on
            ? (match.updated_on as string).slice(0, 10)
            : "Never",
          reorder_level: match?.reorder_level
            ? Number(match.reorder_level)
            : undefined,
        };
      });

      setProducts(combined);
      setLowStock(combined.filter(checkLowStock));
    } catch (error) {
      console.error("Failed to load inventory", error);
      Toast.error("Unable to load branch inventory.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  useBarcodeScanner<InventoryProduct>({
    enabled: products.length > 0,
    items: products,
    getBarcode: (item) => {
      const raw = item.product_barcode;
      if (!raw) return undefined;
      return typeof raw === "number" ? String(raw) : raw.trim();
    },
    onScanSuccess: (_, scannedBarcode) => {
      const normalizedBarcode = scannedBarcode.trim();
      setShowLowStock(false);
      setSearchQuery(normalizedBarcode);
    },
    onScanFailure: (scannedBarcode) => {
      const normalizedBarcode = scannedBarcode.trim();
      setSearchQuery(normalizedBarcode);
      Toast.error("No product matches the scanned barcode.");
    },
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, showLowStock]);

  const filteredProducts = useMemo(() => {
    const source = showLowStock ? lowStock : products;
    if (!searchQuery) return source;
    const query = searchQuery.trim().toLowerCase();
    return source.filter((product) => {
      const matchesName = product.product_name?.toLowerCase().includes(query);
      const matchesBarcode = product.product_barcode
        ?.toLowerCase()
        .includes(query);
      return Boolean(matchesName || matchesBarcode);
    });
  }, [products, lowStock, searchQuery, showLowStock]);

  const sortedProducts = useMemo(
    () =>
      orderBy(
        filteredProducts,
        [sortColumn.path as string],
        [sortColumn.order]
      ),
    [filteredProducts, sortColumn]
  );

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedProducts.slice(start, start + PAGE_SIZE);
  }, [sortedProducts, currentPage]);

  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / PAGE_SIZE));

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

  const handleSelectProduct = (product: InventoryProduct) => {
    try {
      sessionStorage.setItem("inventoryProduct", JSON.stringify(product));
    } catch (error) {
      console.warn("Failed to store product in session storage", error);
    }
    router.push(`/inventory/update/${product.product_id}`);
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 border-b border-border sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg font-semibold">
            Inventory {user.branch_name ? `- ${user.branch_name}` : ""}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Showing {sortedProducts.length} products.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search products (name or barcode)"
            className="w-full min-w-[220px]"
          />
          <Button onClick={() => router.push("/inventory/new")}>
            <PackagePlus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
          <Button
            variant={showLowStock ? "default" : "outline"}
            onClick={() => setShowLowStock((prev) => !prev)}
          >
            {showLowStock ? "Show All Products" : "Low Stock Alert"}
            {!showLowStock && lowStock.length > 0 && (
              <span className="ml-2 rounded-full bg-destructive px-2 py-0.5 text-xs text-destructive-foreground">
                {lowStock.length}
              </span>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("product_name")}
                >
                  <span className="inline-flex items-center gap-1">
                    Name
                    {renderSortIcon("product_name")}
                  </span>
                </TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Buying Price</TableHead>
                <TableHead>Retail Price</TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("quantity")}
                >
                  <span className="inline-flex items-center gap-1">
                    Stock
                    {renderSortIcon("quantity")}
                  </span>
                </TableHead>
                <TableHead>Updated On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-10 text-center text-muted-foreground"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Loading inventory…
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedProducts.length > 0 ? (
                paginatedProducts.map((product, index) => {
                  const isLow = checkLowStock(product);
                  return (
                    <TableRow key={String(product.product_id ?? index)}>
                      <TableCell className="w-[70px]">
                        <div className="relative h-10 w-10 overflow-hidden rounded-md border">
                          <Image
                            src={
                              Array.isArray(product.product_image)
                                ? getImageUrl(product.product_image[0])
                                : typeof product.product_image === "string"
                                ? getImageUrl(product.product_image)
                                : "https://placehold.co/80x80/png"
                            }
                            alt={product.product_name ?? "Product"}
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
                      <TableCell>
                        Rs. {Number(product.retail_price ?? 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            isLow ? "font-semibold text-destructive" : ""
                          }
                        >
                          {Number(product.quantity ?? 0)}
                        </span>
                      </TableCell>
                      <TableCell>{product.updated_on ?? "Never"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSelectProduct(product)}
                        >
                          Update
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No products found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {sortedProducts.length > PAGE_SIZE && (
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

export default UpdateInventory;
