"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import type {
  ColumnDef,
  ColumnFiltersState,
  RowData,
  SortingState,
  VisibilityState,
  CellContext,
} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Button, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Toast } from "@/components/ui";
import { Product_Variant } from "@/types/prisma-types";
import { addProductVariants, deleteProductVariants, updateProductVariants } from "@/services/productService";
import { ProductVariantAddRequest } from "@/types/request-types";

// Extend TanStack Table's meta interface
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    updateData: (rowIndex: number, columnId: string, value: string | number) => void;
  }
}

// Editable cell component for text inputs
const EditableTextCell = ({
  getValue,
  row: { index },
  column: { id },
  table,
}: CellContext<Product_Variant, unknown>) => {
  const initialValue = getValue() as string;
  const [value, setValue] = useState(initialValue);

  const onBlur = () => {
    table.options.meta?.updateData(index, id, value);
  };

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return (
    <Input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={onBlur}
      className="focus-visible:ring-ring h-8 w-full border-0 bg-transparent p-1 focus-visible:ring-1"
      aria-label="editable-text-input"
    />
  );
};

const ProductVariantFormTable = ({
  data,
  setData,
}: {
  data: Product_Variant[];
  setData: React.Dispatch<React.SetStateAction<Product_Variant[]>>;
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const handleVariantDelete = (variant_id: Product_Variant["product_id"]) => {
    setData((prev) => prev.filter((variant) => variant_id !== variant.variant_id));
  };

  const handleAddNewVariant = () => {
    console.log("add");
    const count = data.filter((v) => v.variant_id.startsWith("new-")).length;
    const newVariant: Product_Variant = {
      variant_id: `new-${count + 1}`,
      product_id: `new-product-id`,
      label: "New Variant",
      buying_price: "0.00",
      retail_price: "0.00",
      discount: "0.00",
    };
    setData((prev) => [...prev, newVariant]);
  };

  // Column definitions with editable cells
  const columns: ColumnDef<Product_Variant>[] = [
    {
      accessorKey: "variant_id",
      header: "ID",
      cell: ({ row }) => {
        const id = row.getValue("variant_id") as string;
        if (id.startsWith("new-")) {
          return id;
        }
        return `${id.slice(0, 4)}...${id.slice(-5, -1)}`;
      },
      enableHiding: true,
    },
    {
      accessorKey: "label",
      header: "Label",
      cell: EditableTextCell,
    },
    {
      accessorKey: "buying_price",
      header: "Buying Price",
      cell: EditableTextCell,
    },
    {
      accessorKey: "retail_price",
      header: "Retail Price",
      cell: EditableTextCell,
    },
    {
      accessorKey: "discount",
      header: "Discount",
      cell: EditableTextCell,
    },
    {
      id: "action",
      header: "Delete",
      cell: ({ row }) => (
        <Button
          variant="destructive"
          type="button"
          onClick={() => handleVariantDelete(row.getValue("variant_id"))}
        >
          <Trash2 />
        </Button>
      ),
    },
  ];

  const table = useReactTable({
    data: data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    meta: {
      updateData: (rowIndex, columnId, value) => {
        setData((old) =>
          old.map((row, index) => {
            if (index === rowIndex) {
              return {
                ...old[rowIndex]!,
                [columnId]: value,
              };
            }

            return row;
          })
        );
      },
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  useEffect(() => {
    console.log(data);
  }, [data]);

  return (
    <div className="w-full space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder ? null : (
                        <div>{flexRender(header.column.columnDef.header, header.getContext())}</div>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Add New Product Variant.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-muted-foreground flex items-center justify-between gap-2 text-sm max-md:flex-col">
        <div className="flex flex-row items-center gap-4">
          <Button variant="outline" size="sm" type="button" onClick={handleAddNewVariant}>
            Add New Variant
          </Button>
          <div>{table.getRowModel().rows.length} rows total</div>
        </div>
      </div>
    </div>
  );
};

export default ProductVariantFormTable;
