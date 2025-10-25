"use client";

import { useContext, useMemo } from "react";
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

  const updateCartItem = (product: ProductCartItem, quantity: number) => {
    const cartCopy = [...cart];
    const index = cartCopy.findIndex((item) => item.product_id === product.product_id);
    if (index === -1) return;
    cartCopy[index] = { ...cartCopy[index], quantity };
    setCart(cartCopy);
  };

  const handleIncrement = (product: ProductCartItem) => {
    updateCartItem(product, (product.quantity ?? 0) + 1);
  };

  const handleDecrement = (product: ProductCartItem) => {
    updateCartItem(product, (product.quantity ?? 0) - 1);
  };

  const handleRemove = (product: ProductCartItem) => {
    const cartCopy = [...cart];
    const index = cartCopy.findIndex((item) => item.product_id === product.product_id);
    if (index === -1) return;
    cartCopy.splice(index, 1);
    setCart(cartCopy);
  };

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
    if (!sortColumn || sortColumn.path !== path) {
      return <ArrowUpDown className="h-3.5 w-3.5" />;
    }

    return sortColumn.order === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />;
  };

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
        {orderedCart.map((product) => {
          const total = (product.quantity ?? 0) * (Number(product.variant.retail_price) ?? 0);

          return (
            <TableRow key={product.product_id}>
              <TableCell className="font-mono text-sm">{product.product_barcode ?? "-"}</TableCell>
              <TableCell className="font-medium">{product.product_name}</TableCell>
              <TableCell className="text-right">{formatCurrency(Number(product.variant.retail_price) ?? 0)}</TableCell>
              <TableCell className="text-right">{formatCurrency(Number(product.variant.discount) ?? 0)}</TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    data-testid="decrement"
                    onClick={() => handleDecrement(product)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    readOnly={product.stock_type == "items"}
                    value={product.quantity}
                    className="h-9 w-32 text-center"
                    onChange={(e) => updateCartItem(product, Number(e.target.value))}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    data-testid="increment"
                    onClick={() => handleIncrement(product)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
              <TableCell className="text-right">{formatCurrency(total)}</TableCell>
              <TableCell className="text-right">
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  onClick={() => handleRemove(product)}
                  data-testid="remove"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
        {orderedCart.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
              Cart is empty.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default SaleCartTable;
