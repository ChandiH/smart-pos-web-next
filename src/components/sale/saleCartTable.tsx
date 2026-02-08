"use client";

import { useContext, useMemo, useState, useEffect, useRef } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Minus, Plus, Trash2 } from "lucide-react";

import CartContext, { ProductCartItem } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type SortOrder = "asc" | "desc";

type SortColumn = {
  path: string;
  order: SortOrder;
};

type CartItem = {
  product_id: string | number;
  product_name: string;
  product_barcode?: string;
  retail_price: number;
  quantity: number;
  discount?: number;
  [key: string]: unknown;
};

interface SaleCartTableProps {
  sortColumn?: SortColumn;
  onSort?: (column: SortColumn) => void;
}

const formatCurrency = (value: number) => `Rs. ${Number.isFinite(value) ? value.toFixed(2) : "0.00"}`;

const SaleCartTable = ({ sortColumn, onSort }: SaleCartTableProps) => {
  const { cart, setCart } = useContext(CartContext);

  const orderedCart = useMemo(() => [...cart].reverse(), [cart]);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const prevCartLength = useRef<number>(cart.length);

  // -----------------------------
  // Cart operations
  // -----------------------------
  const updateCartItem = (product: ProductCartItem, quantity: number) => {
    const copy = [...cart];
    const index = copy.findIndex((item) => item.product_id === product.product_id);
    if (index === -1) return;
    copy[index] = { ...copy[index], quantity };
    setCart(copy);
  };

  const handleIncrement = (product: ProductCartItem) => {
    updateCartItem(product, (product.quantity ?? 0) + 1);
  };

  const handleDecrement = (product: ProductCartItem) => {
    updateCartItem(product, (product.quantity ?? 0) - 1);
  };

  const handleRemove = (product: ProductCartItem) => {
    const copy = [...cart];
    const index = copy.findIndex((item) => item.product_id === product.product_id);
    if (index === -1) return;
    copy.splice(index, 1);
    setCart(copy);
    setSelectedIndex((prev) => {
      if (prev === null) return null;
      if (prev > index) return prev - 1;
      if (prev === index) return null;
      return prev;
    });
  };

  // -----------------------------
  // Sorting
  // -----------------------------
  const handleSort = (path: string) => {
    if (!onSort) return;
    const nextColumn: SortColumn = sortColumn ? { ...sortColumn } : { path, order: "asc" };
    if (nextColumn.path === path) {
      nextColumn.order = nextColumn.order === "asc" ? "desc" : "asc";
    } else {
      nextColumn.path = path;
      nextColumn.order = "asc";
    }
    onSort(nextColumn);
  };

  const renderSortIcon = (path: string) => {
    if (!sortColumn || sortColumn.path !== path) return <ArrowUpDown className="h-3.5 w-3.5" />;
    return sortColumn.order === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />;
  };

  // -----------------------------
  // Auto-select newly added item only once
  // -----------------------------
  useEffect(() => {
    if (cart.length > prevCartLength.current) {
      // New item added, select newest item
      setSelectedIndex(0);
      setEditingIndex(null);
    }
    prevCartLength.current = cart.length;
  }, [cart]);

  // -----------------------------
  // Keyboard shortcuts
  // -----------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!orderedCart.length) return;
      if (selectedIndex === null) return;
      const selectedProduct = orderedCart[selectedIndex];

      // Arrow navigation
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev === null ? 0 : Math.min(prev + 1, orderedCart.length - 1)));
        setEditingIndex(null);
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev === null ? 0 : Math.max(prev - 1, 0)));
        setEditingIndex(null);
      }

      // Increment / decrement quantity
      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleIncrement(selectedProduct);
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleDecrement(selectedProduct);
      }

      // Ctrl key → focus quantity input for non-items
      if (e.ctrlKey && selectedProduct.stock_type?.toLowerCase() !== "items" && selectedProduct.stock_type?.toLowerCase() !== "items") {
        e.preventDefault();
        setEditingIndex(selectedIndex);
        const inputEl = document.getElementById(`cart-qty-${selectedIndex}`) as HTMLInputElement | null;
        if (inputEl) {
          inputEl.focus();
          inputEl.select();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [orderedCart, selectedIndex]);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <button
              type="button"
              onClick={() => handleSort("product_barcode")}
              className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              Barcode
              {renderSortIcon("product_barcode")}
            </button>
          </TableHead>
          <TableHead>
            <button
              type="button"
              onClick={() => handleSort("product_name")}
              className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              Name
              {renderSortIcon("product_name")}
            </button>
          </TableHead>
          <TableHead className="text-right">
            <button
              type="button"
              onClick={() => handleSort("retail_price")}
              className="inline-flex w-full items-center justify-end gap-1 text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              Retail Price
              {renderSortIcon("retail_price")}
            </button>
          </TableHead>
          <TableHead className="text-right">Discount</TableHead>
          <TableHead className="text-right">Quantity</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="text-right">Remove</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orderedCart.map((product, index) => {
          const total = (product.quantity ?? 0) * (Number(product.variant.retail_price) ?? 0);
          return (
            <TableRow
              key={product.product_id}
              className={selectedIndex === index ? "bg-blue-100 dark:bg-blue-900" : ""}
              onClick={() => setSelectedIndex(index)}
            >
              <TableCell className="font-mono text-sm">{product.product_barcode ?? "-"}</TableCell>
              <TableCell className="font-medium">{product.product_name}</TableCell>
              <TableCell className="text-right">{formatCurrency(Number(product.variant.retail_price) ?? 0)}</TableCell>
              <TableCell className="text-right">{formatCurrency(Number(product.variant.discount) ?? 0)}</TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-2">
                  <Button type="button" size="icon" variant="outline" onClick={() => handleDecrement(product)}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    id={`cart-qty-${index}`}
                    type="number"
                    readOnly={product.stock_type === "items"}
                    value={product.quantity}
                    className="h-9 w-32 text-center"
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) updateCartItem(product, val);
                    }}
                  />
                  <Button type="button" size="icon" variant="outline" onClick={() => handleIncrement(product)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
              <TableCell className="text-right">{formatCurrency(total)}</TableCell>
              <TableCell className="text-right">
                <Button type="button" size="icon" variant="destructive" onClick={() => handleRemove(product)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
        {orderedCart.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="py-6 text-center text-sm text-muted-foreground">
              Cart is empty.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default SaleCartTable;
