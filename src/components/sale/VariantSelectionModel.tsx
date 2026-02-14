"use client";
import React, { useEffect, useState, useCallback } from "react";
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
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
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
  const [sortColumn, setSortColumn] = useState<SortColumn>({ path: "variant_id", order: "asc" });
  const [highlightIndex, setHighlightIndex] = useState<number>(0);

  // Auto-select if ONLY ONE variant
  useEffect(() => {
    if (product && product.variants.length === 1 && onSelect) {
      onSelect(product.variants[0]);
    }
  }, [product, onSelect]);

  // Reset highlight when opening modal
  useEffect(() => {
    if (open) setHighlightIndex(0);
  }, [open]);

  const handleSort = (path: SortColumn["path"]) => {
    setSortColumn(prev =>
      prev.path === path
        ? { path, order: prev.order === "asc" ? "desc" : "asc" }
        : { path, order: "asc" },
    );
  };

  const renderSortIcon = (column: ColumnConfig) => {
    if (!column.sortable || !column.path) return null;
    if (sortColumn.path !== column.path) return <ArrowUpDown className="h-3.5 w-3.5" />;

    return sortColumn.order === "asc"
      ? <ArrowUp className="h-3.5 w-3.5" />
      : <ArrowDown className="h-3.5 w-3.5" />;
  };

  // ------------- 🔥 KEYBOARD SHORTCUTS (1–9 + ENTER + ESC) -------------
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open || !product) return;

      const count = product.variants.length;

      // number keys (1–9)
      if (/^[1-9]$/.test(e.key)) {
        const index = Number(e.key) - 1;
        if (index < count) {
          e.preventDefault();
          onSelect?.(product.variants[index]);
        }
      }

      // Enter = pick highlighted variant
      if (e.key === "Enter") {
        e.preventDefault();
        if (product.variants[highlightIndex]) {
          onSelect?.(product.variants[highlightIndex]);
        }
      }

      // ESC to close modal
      if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      }

      // Arrow navigation
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIndex(i => Math.min(i + 1, count - 1));
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIndex(i => Math.max(i - 1, 0));
      }
    },
    [open, product, highlightIndex, onSelect, onOpenChange]
  );

  // Attach keyboard listener ONLY when modal is open
  useEffect(() => {
    if (open) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onKeyDown]);

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:w-auto max-w-[min(90vw,72rem)]">
        <DialogHeader>
          <DialogTitle>Select Variant</DialogTitle>
        </DialogHeader>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map(column => (
                  <TableHead
                    key={column.key}
                    className={column.sortable ? "cursor-pointer" : undefined}
                    onClick={() => column.path && handleSort(column.path)}
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
              {product.variants.map((variant, index) => (
                <TableRow
                  key={variant.variant_id}
                  className={`cursor-pointer text-lg h-4 ${
                    highlightIndex === index ? "bg-blue-100 dark:bg-blue-900" : "hover:bg-muted/60"
                  }`}
                  onClick={() => onSelect?.(variant)}
                >
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{variant.label ?? "—"}</TableCell>
                  <TableCell>{Number(variant.retail_price).toFixed(2)}</TableCell>
                  <TableCell>{Number(variant.discount).toFixed(2)}</TableCell>
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