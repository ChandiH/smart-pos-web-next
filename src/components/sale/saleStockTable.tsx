"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import { ProductDetails } from "@/types/prisma-types";
import { SortDirection } from "@/types/common-types";

type ProductColumn = "product_name" | "product_barcode";

type SortColumn = {
  path: ProductColumn | string;
  order: SortDirection;
};

interface SaleStockTableProps {
  products: ProductDetails[];
  sortColumn: SortColumn;
  onSort: (column: SortColumn) => void;
  onSelect: (product: ProductDetails) => void;
}

const sortableColumns: Array<{
  label: string;
  path: ProductColumn;
  align?: "left" | "right";
}> = [
  { label: "Barcode", path: "product_barcode" },
  { label: "Name", path: "product_name" },
];

const SaleStockTable = ({ products, sortColumn, onSort, onSelect }: SaleStockTableProps) => {
  const handleSort = (path: ProductColumn) => {
    const nextColumn: SortColumn = { ...sortColumn };
    if (nextColumn.path === path) {
      nextColumn.order = nextColumn.order === "asc" ? "desc" : "asc";
    } else {
      nextColumn.path = path;
      nextColumn.order = "asc";
    }
    onSort(nextColumn);
  };

  const renderSortIcon = (path: ProductColumn) => {
    if (sortColumn.path !== path) {
      return <ArrowUpDown className="h-3.5 w-3.5" />;
    }

    return sortColumn.order === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {sortableColumns.map(({ label, path, align }) => (
            <TableHead key={path} className={align === "right" ? "text-right" : "text-left"}>
              <button
                type="button"
                onClick={() => handleSort(path)}
                className="inline-flex w-full items-center justify-start gap-1 text-sm font-medium text-muted-foreground transition hover:text-foreground"
              >
                {label}
                {renderSortIcon(path)}
              </button>
            </TableHead>
          ))}
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.product_id}>
            <TableCell className="text-left">{product.product_barcode}</TableCell>
            <TableCell className="font-medium">{product.product_name}</TableCell>
            <TableCell className="text-right">
              <Button size="sm" onClick={() => onSelect(product)}>
                Add to Cart
              </Button>
            </TableCell>
          </TableRow>
        ))}
        {products.length === 0 && (
          <TableRow>
            <TableCell colSpan={sortableColumns.length + 1} className="py-6 text-center text-sm text-muted-foreground">
              Start typing to search for products.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default SaleStockTable;
