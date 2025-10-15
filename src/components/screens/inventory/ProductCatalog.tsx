"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import orderBy from "lodash/orderBy";
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2, Trash2 } from "lucide-react";

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
import { ScrollArea } from "@/components/ui/scroll-area";
import { getImageUrl } from "@/services/imageHandler";
import {
  deleteProduct,
  getProductWithCategory,
} from "@/services/productService";
import type { Product } from "@/services/types";
import { Toast } from "@/components/ui";

type SortDirection = "asc" | "desc";

type SortColumn = {
  path: keyof CatalogProduct;
  order: SortDirection;
};

type CatalogProduct = Product & {
  category_name?: string;
  product_image?: string[] | string;
  supplier_id?: string | number;
};

const PAGE_SIZE = 20;

const ProductCatalog = () => {
  const router = useRouter();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn>({
    path: "product_name",
    order: "asc",
  });

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const { data } = await getProductWithCategory();
      const items = Array.isArray(data) ? (data as CatalogProduct[]) : [];
      setProducts(items.filter((product) => !product.removed));
    } catch (error) {
      console.error("Failed to load products", error);
      Toast.error("Unable to load products. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchProducts();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const query = searchQuery.trim().toLowerCase();
    return products.filter((product) => {
      const matchesName = product.product_name?.toLowerCase().includes(query);
      const matchesBarcode = product.product_barcode
        ?.toLowerCase()
        .includes(query);
      return Boolean(matchesName || matchesBarcode);
    });
  }, [products, searchQuery]);

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

  const handleDelete = async (productId: string | number) => {
    try {
      const promise = deleteProduct(productId);
      Toast.promise(promise, {
        loading: "Deleting product…",
        success: "Product deleted",
        error: (error) =>
          error.response?.data?.error ?? "Failed to delete product",
      });
      await promise;
      void fetchProducts();
    } catch (error) {
      console.error("Failed to delete product", error);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 border-b border-border sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg font-semibold">
            Product Catalog
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Showing {sortedProducts.length} products in the database.
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
            Add Product
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
                <TableHead>Barcode</TableHead>
                <TableHead className="text-right">Supplier</TableHead>
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
                      Loading products…
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedProducts.length > 0 ? (
                paginatedProducts.map((product, index) => (
                  <TableRow
                    key={String(product.product_id ?? index)}
                    className="align-middle"
                  >
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
                    <TableCell>
                      Rs. {Number(product.retail_price ?? 0).toFixed(2)}
                    </TableCell>
                    <TableCell>{product.product_barcode ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      {product.supplier_id ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() =>
                          product.product_id && handleDelete(product.product_id)
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
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
        <ScrollArea className="max-w-[200px] whitespace-nowrap">
          <div className="flex items-center gap-1 p-1">
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
        </ScrollArea>
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

export default ProductCatalog;
