"use client";
import React, { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2 } from "lucide-react";
import { Product_Variant, ProductDetails } from "@/types/prisma-types";
import { SortDirection } from "@/types/common-types";

type VariantSelectionModelProps = {
  open: boolean;
  product: ProductDetails | null;
  onOpenChange: (open: boolean) => void;
  onSelect?: (variant: Product_Variant) => void;
};

type SortColumn = {
  path: keyof Product_Variant | "retail_price";
  order: SortDirection;
};

type ColumnConfig = {
  key: keyof Product_Variant | "actions" | "supplier_id";
  label: string;
  path?: SortColumn["path"];
  sortable?: boolean;
};

const columns: ColumnConfig[] = [
  {
    key: "variant_id",
    label: "ID",
  },
  {
    key: "label",
    label: "Label",
  },
  {
    key: "retail_price",
    label: "Retail Price",
    path: "retail_price",
    sortable: true,
  },
  {
    key: "discount",
    label: "Discount",
    path: "discount",
    sortable: true,
  },
];

const VariantSelectionModel = ({ open, product, onOpenChange, onSelect }: VariantSelectionModelProps) => {
  useEffect(() => {
    if (product && product.variants.length === 1 && onSelect) {
      onSelect(product.variants[0]);
    }
  }, [onSelect, product]);

  const [sortColumn, setSortColumn] = useState<SortColumn>({
    path: "variant_id",
    order: "asc",
  });

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

  const renderSortIcon = (column: ColumnConfig) => {
    if (!column.sortable || !column.path) {
      return null;
    }

    if (sortColumn.path !== column.path) {
      return <ArrowUpDown className="h-3.5 w-3.5" />;
    }

    return sortColumn.order === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />;
  };

  const getVariantField = (variant: Product_Variant, ...keys: (keyof Product_Variant | string)[]) => {
    for (const key of keys) {
      if (key in variant) {
        const value = variant[key as keyof Product_Variant];
        if (value !== undefined && value !== null && value !== "") {
          return value;
        }
      }
    }
    return undefined;
  };

  if (!product) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:w-auto max-w-[min(90vw,_72rem)]">
        <DialogHeader>
          <DialogTitle>Product Variants</DialogTitle>
        </DialogHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={column.sortable ? "cursor-pointer" : undefined}
                    onClick={() => column.sortable && column.path && handleSort(column.path)}
                  >
                    <span className="flex items-center gap-1">
                      {column.label}
                      {renderSortIcon(column)}
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {product.variants?.map((variant, index) => (
                <TableRow
                  key={String(getVariantField(variant, "variant_id", "id") ?? index)}
                  className="cursor-pointer text-lg hover:bg-muted/60 h-4"
                  onClick={() => onSelect?.(variant)}
                >
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{variant.label ?? "—"}</TableCell>
                  <TableCell>{Number(variant.retail_price).toFixed(2) ?? "—"}</TableCell>
                  <TableCell>{Number(variant.discount).toFixed(2) ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VariantSelectionModel;
