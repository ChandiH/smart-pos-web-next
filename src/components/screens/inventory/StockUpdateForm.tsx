"use client";

import { useContext, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Minus, Plus } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import UserContext from "@/context/UserContext";
import { getAllBranches } from "@/services/branchService";
import { getInventoryByProduct, updateInventory } from "@/services/inventoryService";
import { updateProductDiscount } from "@/services/productService";
import type { Branch, Identifier } from "@/services/types";
import { Toast } from "@/components/ui";
import { ProductWithInventory, Inventory } from "@/types/prisma-types";
import EditableDataTableDemo from "@/components/ui/composite/data-table-demo";

type ExtendedUser = {
  branch_id?: Identifier;
  branch_name?: string;
  employee_id?: Identifier;
  [key: string]: unknown;
};

type BranchStock = {
  branch_id: Identifier;
  branch_name?: string;
  quantity: number;
};

const StockUpdateForm = () => {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const productId = params?.id;

  const { currentUser } = useContext(UserContext);
  const user = (currentUser as ExtendedUser | null) ?? {};

  const [product, setProduct] = useState<ProductWithInventory | null>(null);
  const [otherBranches, setOtherBranches] = useState<BranchStock[]>([]);
  const [quantity, setQuantity] = useState(0);
  const [reorderLevel, setReorderLevel] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);

  const fetchData = async () => {
    if (!productId || !user.branch_id) return;

    try {
      setIsLoading(true);
      const [{ data: productInventory }, { data: branches }] = await Promise.all([
        getInventoryByProduct(productId),
        getAllBranches(),
      ]);

      setProduct(productInventory);

      const inventoryList: Inventory[] = Array.isArray(productInventory.inventory)
        ? (productInventory.inventory as Inventory[])
        : [];

      const branchRecords: Branch[] = Array.isArray(branches) ? (branches as Branch[]) : [];

      const currentBranchStock = inventoryList.find((item) => item.branch_id === user.branch_id);

      if (currentBranchStock) {
        setReorderLevel(Number(currentBranchStock.reorder_level ?? 0));
        setDiscount(Number(productInventory.discount ?? 0));
      }

      const otherBranchStocks: BranchStock[] = branchRecords
        .filter((branch) => branch.branch_id !== user.branch_id)
        .map((branch) => {
          const record = inventoryList.find((item) => item.branch_id === branch.branch_id);
          return {
            branch_id: branch.branch_id ?? "",
            branch_name: branch.branch_name ?? (branch as Record<string, string>)["branch_city"],
            quantity: Number(record?.quantity ?? 0),
          };
        });

      setOtherBranches(otherBranchStocks);
    } catch (error) {
      console.error("Failed to load inventory details", error);
      Toast.error("Unable to load product inventory.");
      router.replace("/inventory/update");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, user.branch_id]);

  const handleQuantityChange = (value: number) => {
    setQuantity(value);
  };

  const handleReorderLevelChange = (value: number) => {
    if (Number.isNaN(value) || value < 0) return;
    setReorderLevel(value);
  };

  const handleDiscountChange = (value: number) => {
    if (Number.isNaN(value) || value < 0) return;
    setDiscount(value);
  };

  const updateInventoryQuantity = async () => {
    if (!productId || !user.branch_id || !product) return;
    if (
      quantity === 0 &&
      reorderLevel === Number(product.inventory.find((item) => item.branch_id === user.branch_id)?.reorder_level ?? 0)
    ) {
      Toast.message("No quantity change to apply.");
      return;
    }

    try {
      setIsMutating(true);
      const promise = updateInventory({
        branch_id: user.branch_id,
        product_id: productId,
        quantity: Number(product.inventory.find((item) => item.branch_id === user.branch_id)?.quantity ?? 0) + quantity,
        reorder_level: reorderLevel,
      });
      Toast.promise(promise, {
        loading: "Updating inventory…",
        success: "Inventory updated successfully",
        error: (error) => error?.response?.data?.error ?? "Failed to update inventory",
      });
      await promise;
      setQuantity(0);
      await fetchData();
    } catch (error) {
      console.error("Failed to update inventory", error);
    } finally {
      setIsMutating(false);
    }
  };

  const updateDiscount = async () => {
    if (!productId) return;
    try {
      setIsMutating(true);
      const promise = updateProductDiscount(productId, Number(discount).toFixed(2));
      Toast.promise(promise, {
        loading: "Updating discount…",
        success: "Discount updated",
        error: (error) => error?.response?.data?.error ?? "Failed to update discount",
      });
      await promise;
      await fetchData();
    } catch (error) {
      console.error("Failed to update discount", error);
    } finally {
      setIsMutating(false);
    }
  };

  const handleSubmitAndReturn = async () => {
    await updateInventoryQuantity();
    router.replace("/inventory/update");
  };

  if (isLoading && !product) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading stock details…
      </div>
    );
  }

  if (!product) {
    return <div className="text-center text-muted-foreground">Product details unavailable.</div>;
  }

  const productDescription = (product as ProductWithInventory).product_desc;

  return (
    <div className="grid grid-cols-[440px_1fr] gap-6">
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{product.product_name ?? "Unnamed Product"}</CardTitle>
          <p className="text-sm text-muted-foreground">{product.category?.category_name ?? "No category"}</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {productDescription && (
              <div className="space-y-2 text-sm">
                <h3 className="font-semibold">Description</h3>
                <p className="text-muted-foreground">{productDescription}</p>
              </div>
            )}
            <div className="rounded-lg border bg-muted/40 p-4 text-sm">
              <div className="flex flex-col gap-2">
                <div>
                  <span className="text-muted-foreground">Current stock:</span>
                  <span className="ml-2 font-medium">
                    {Number(product.inventory.find((item) => item.branch_id === user.branch_id)?.quantity ?? 0)} items
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Location:</span>
                  <span className="ml-2 font-medium">{user.branch_name ?? "Current branch"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Last updated:</span>
                  <span className="ml-2 font-medium">{product.updated_on ?? "Never"}</span>
                </div>
              </div>
            </div>
            <div className="rounded-lg border">
              <h3 className="px-4 py-3 text-sm font-semibold">Stock in other branches</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Branch</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {otherBranches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="py-6 text-center text-sm text-muted-foreground">
                        No additional branches found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    otherBranches.map((branch) => (
                      <TableRow key={String(branch.branch_id)}>
                        <TableCell>{branch.branch_name ?? "Branch"}</TableCell>
                        <TableCell className="text-right">{branch.quantity}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <Image
              src={"/assets/images/placeholder/product.png"}
              alt={"Product Image"}
              width={200}
              height={200}
              className="mx-auto rounded-md border object-contain"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="h-full">
        <CardHeader>
          <div className="grid gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Buying price</span>
              <span className="font-medium">Rs. {Number(product.buying_price ?? 0).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Retail price</span>
              <span className="font-medium">Rs. {Number(product.retail_price ?? 0).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Current discount</span>
              <span className="font-medium">Rs. {Number(product.discount ?? 0).toFixed(2)}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <EditableDataTableDemo />
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <div className="space-y-2">
                <label className="text-sm font-medium">Change Discount (Rs.)</label>
                <Input
                  type="number"
                  value={discount}
                  min={0}
                  onChange={(event) => handleDiscountChange(Number(event.target.value))}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={updateDiscount} disabled={isMutating} className="w-full md:w-auto">
                  Update Discount
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <div className="space-y-2">
                <label className="text-sm font-medium">Reorder Alert Level</label>
                <Input
                  type="number"
                  value={reorderLevel}
                  min={0}
                  onChange={(event) => handleReorderLevelChange(Number(event.target.value))}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={updateInventoryQuantity}
                  disabled={isMutating}
                  variant="outline"
                  className="w-full md:w-auto"
                >
                  Update Reorder Level
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Adjust Quantity</label>
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-md border">
                  <Button type="button" size="icon" variant="ghost" onClick={() => handleQuantityChange(quantity - 1)}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(event) => handleQuantityChange(Number(event.target.value))}
                    className="h-10 w-20 border-x-0 text-center"
                  />
                  <Button type="button" size="icon" variant="ghost" onClick={() => handleQuantityChange(quantity + 1)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Button onClick={updateInventoryQuantity} disabled={isMutating || quantity === 0}>
                  Update Inventory
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={handleSubmitAndReturn} disabled={isMutating}>
              Save &amp; Return
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockUpdateForm;
