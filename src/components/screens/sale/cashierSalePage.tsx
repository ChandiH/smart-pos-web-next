"use client";

import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import orderBy from "lodash/orderBy";

import CartContext, { ProductCartItem } from "@/context/CartContext";
import UserContext from "@/context/UserContext";
import SaleCartTable from "@/components/sale/saleCartTable";
import SaleStockTable from "@/components/sale/saleStockTable";
import { getCustomers } from "@/services/customerService";
import { getInventoryWithProduct } from "@/services/inventoryService";
import { getRewardsPointsPercentage, submitOrder } from "@/services/orderService";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Separator,
  Toast,
} from "@/components/ui";
import useBarcodeScanner from "@/hooks/useBarcodeScanner";
import ReceiptPrinter, { ReceiptBill, ReceiptPrinterHandle } from "@/components/print/ReceiptPrinter";
import { Customer, Product_Variant, ProductDetails } from "@/types/prisma-types";
import { SortDirection } from "@/types/common-types";
import VariantSelectionModel from "@/components/sale/VariantSelectionModel";

type SortColumn = {
  path: string;
  order: SortDirection;
};

type CashierUser = {
  branch_id?: string;
  employee_id?: string;
  employee_name?: string;
  [key: string]: unknown;
};

type PaymentMethod = "cash" | "credit/debit" | "mobile" | "loyalty";

const guestCustomer: Customer = {
  customer_id: 0,
  customer_name: "Guest Customer",
  customer_email: "",
  customer_phone: "0000000000",
  customer_address: "",
  rewards_points: "0",
  credits: "0",
  visit_count: 0,
  created_at: new Date().toDateString(),
};

const paymentMethods: {
  label: string;
  value: PaymentMethod;
  disabled?: boolean;
}[] = [
  { label: "Cash", value: "cash" },
  { label: "Credit/Debit", value: "credit/debit" },
  { label: "Mobile Payment", value: "mobile", disabled: true },
  { label: "Loyalty", value: "loyalty" },
];

const formatCurrency = (value: number) => `Rs. ${Number.isFinite(value) ? value.toFixed(2) : "0.00"}`;

const CashierSalePage = () => {
  const router = useRouter();
  const { currentUser } = useContext(UserContext);
  const { cart, setCart } = useContext(CartContext);

  const [sortColumn, setSortColumn] = useState<SortColumn>({
    path: "product_name",
    order: "asc",
  });

  const cartSortColumn: SortColumn = useMemo(
    () => ({
      path: "product_name",
      order: "desc",
    }),
    []
  );

  const [products, setProducts] = useState<ProductDetails[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customer, setCustomer] = useState<Customer>({ ...guestCustomer });
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [isCustomerSearchFocused, setCustomerSearchFocused] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [paymentDetails, setPaymentDetails] = useState("");
  const [rewardsPointsPercentage, setRewardsPointsPercentage] = useState(0);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [variantModel, setVariantModel] = useState<boolean>(false);
  const [pendingVariantProduct, setPendingVariantProduct] = useState<ProductDetails | null>(null);

  const customerSearchInputRef = useRef<HTMLInputElement | null>(null);
  const receiptPrinterRef = useRef<ReceiptPrinterHandle | null>(null);

  const typedUser = (currentUser as CashierUser | null) ?? null;
  const branchId = typedUser?.branch_id;

  const loadData = useCallback(async () => {
    if (!branchId) return;

    try {
      const [{ data: rewards }, { data: customerList }, { data: productList }] = await Promise.all([
        getRewardsPointsPercentage(),
        getCustomers(),
        getInventoryWithProduct(),
      ]);

      const availableProducts = (Array.isArray(productList) ? productList : []).filter((product) => !product.removed);
      setProducts(availableProducts);
      setCustomers(customerList);

      const percentage = Array.isArray(rewards) && rewards.length > 0 ? Number(rewards[0]?.variable_value ?? 0) : 0;
      setRewardsPointsPercentage(Number.isFinite(percentage) ? percentage : 0);
    } catch (error) {
      console.error("Failed to load cashier data", error);
      Toast.error("Unable to load cashier data. Please try again.");
    }
  }, [branchId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useBarcodeScanner<Customer>({
    enabled: isCustomerSearchFocused && customers.length > 0,
    items: customers,
    getBarcode: (item) => {
      const rawValue = item.customer_phone ?? item.customer_id;
      if (rawValue === undefined || rawValue === null) {
        return undefined;
      }
      if (typeof rawValue === "number") {
        return String(rawValue);
      }
      if (typeof rawValue === "string") {
        return rawValue.trim();
      }
      return undefined;
    },
    onScanSuccess: (matchedCustomer, scannedBarcode) => {
      const normalizedBarcode = scannedBarcode.trim();
      const displayValue = matchedCustomer.customer_name?.trim() || normalizedBarcode;
      console.log("[BarcodeScanner][Customer] Match", {
        barcode: normalizedBarcode,
        customerId: matchedCustomer.customer_id,
      });
      setCustomerSearchQuery(displayValue);
      setCustomer(matchedCustomer);
      customerSearchInputRef.current?.blur();
    },
    onScanFailure: (scannedBarcode) => {
      const normalizedBarcode = scannedBarcode.trim();
      console.log("[BarcodeScanner][Customer] No match", {
        barcode: normalizedBarcode,
      });
      setCustomerSearchQuery(normalizedBarcode);
      setCustomer({ ...guestCustomer });
      Toast.error("No customer matches the scanned barcode.");
    },
  });

  useBarcodeScanner<ProductDetails>({
    enabled: !isCustomerSearchFocused && products.length > 0,
    items: products,
    getBarcode: (item) => {
      const rawValue = item.product_barcode;
      if (rawValue === undefined || rawValue === null) {
        return undefined;
      }
      if (typeof rawValue === "number") {
        return String(rawValue);
      }
      if (typeof rawValue === "string") {
        return rawValue.trim();
      }
      return undefined;
    },
    onScanSuccess: (matchedProduct) => {
      console.log("[BarcodeScanner][Product] Match", {
        barcode: matchedProduct.product_barcode,
        productId: matchedProduct.product_id,
      });
      handleVariantSelection(matchedProduct);
    },
    onScanFailure: (scannedBarcode) => {
      const normalizedBarcode = scannedBarcode.trim();
      console.log("[BarcodeScanner][Product] No match", {
        barcode: normalizedBarcode,
      });
      setProductSearchQuery(normalizedBarcode);
      Toast.error("No product matches the scanned barcode.");
    },
  });

  const handleSort = (column: SortColumn) => {
    setSortColumn(column);
  };

  const handleProductSearch = (query: string) => {
    setProductSearchQuery(query);
  };

  const handleCustomerSearch = (query: string) => {
    setCustomerSearchQuery(query);
    if (!query) {
      setCustomer({ ...guestCustomer });
      return;
    }

    const normalizedQuery = query.trim();
    const lowerQuery = normalizedQuery.toLowerCase();

    const filteredCustomer = customers.find((item) => {
      const matchesName = item.customer_name?.toLowerCase().startsWith(lowerQuery);
      const matchesPhone = item.customer_phone && String(item.customer_phone).trim() === normalizedQuery;

      return Boolean(matchesName || matchesPhone);
    });

    setCustomer(filteredCustomer ?? { ...guestCustomer });
  };

  const onAddToCart = (productVariant: Product_Variant) => {
    setProductSearchQuery("");
    setCart((prevCart: ProductCartItem[]) => {
      const cartCopy = [...prevCart];
      const productIndex = products.findIndex((p) => p.product_id === productVariant.product_id);
      const existingProductIndex = cartCopy.findIndex((item) => item.product_id === productVariant.product_id);

      if (existingProductIndex !== -1) {
        const existingProduct = cartCopy[existingProductIndex];
        cartCopy[existingProductIndex] = {
          ...existingProduct,
          quantity: (existingProduct.quantity ?? 0) + 1,
        };
        return cartCopy;
      }

      cartCopy.push({ ...products[productIndex], quantity: 1, variant: productVariant });
      return cartCopy;
    });
    setPendingVariantProduct(null);
    setVariantModel(false);
  };

  const totals = useMemo(() => {
    const quantity = cart.reduce((acc, item) => acc + (item.quantity ?? 0), 0);
    const subtotal = cart.reduce((acc, item) => acc + (item.quantity ?? 0) * Number(item.variant.retail_price ?? 0), 0);

    const discount = cart.reduce((acc, item) => acc + (item.quantity ?? 0) * Number(item.variant.discount ?? 0), 0);

    const profit = cart.reduce((acc, item) => {
      const totalProfit =
        (item.quantity ?? 0) * (Number(item.variant.retail_price ?? 0) - Number(item.variant.buying_price ?? 0)) -
        Number(item.variant.discount ?? 0);
      return acc + totalProfit;
    }, 0);

    const subtotalRounded = Number(subtotal.toFixed(2));
    const discountRounded = Number(discount.toFixed(2));
    const profitRounded = Number(profit.toFixed(2));
    const grandTotal = Number(Math.max(subtotalRounded - discountRounded, 0).toFixed(2));

    return {
      quantity,
      subtotal: subtotalRounded,
      discount: discountRounded,
      profit: profitRounded,
      grandTotal,
    };
  }, [cart]);

  const rewardsPoints = useMemo(() => {
    if (customer.customer_name === guestCustomer.customer_name) {
      return 0;
    }

    const points = (totals.subtotal * rewardsPointsPercentage) / 100;
    return Number(points.toFixed(2));
  }, [customer.customer_name, totals.subtotal, rewardsPointsPercentage]);

  const filteredProducts = useMemo(() => {
    if (!productSearchQuery) {
      return [] as ProductDetails[];
    }

    const query = productSearchQuery.trim().toLowerCase();
    const filtered = products.filter(
      (product) =>
        product.product_name?.toLowerCase().startsWith(query) ||
        product.product_barcode?.startsWith(productSearchQuery.trim())
    );

    return orderBy(filtered, [sortColumn.path], [sortColumn.order]).slice(0, 3);
  }, [productSearchQuery, products, sortColumn]);

  const validateOrder = () => cart.length > 0 && Boolean(paymentDetails);

  const paymentHandler = (method: PaymentMethod) => {
    if (paymentMethod === method) return;
    setPaymentMethod(method);
    setPaymentDetails("");
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleAddCustomer = () => {
    router.push("/customers/new");
  };

  const handlePlaceOrder = async () => {
    if (!validateOrder()) return;
    if (!typedUser?.employee_id || !typedUser?.branch_id) {
      Toast.error("Missing cashier information. Please sign in again.");
      return;
    }

    const order = {
      customer_id: customer.customer_id,
      cashier_id: typedUser.employee_id,
      total_amount: totals.subtotal.toFixed(2),
      profit: totals.profit.toFixed(2),
      payment_method_id: "1",
      reference_id: paymentDetails,
      branch_id: typedUser.branch_id,
      rewards_points: rewardsPoints.toFixed(2),
      product_count: totals.quantity,
    };

    const orderedProducts = cart.map((product) => ({
      product_id: product.product_id,
      quantity: product.quantity,
    }));

    try {
      const promise = submitOrder({
        salesData: {
          order,
          products: orderedProducts,
        },
      });

      Toast.promise(promise, {
        success: "Order placed",
        error: (error) => error.response?.data?.error ?? "Failed to place order",
      });

      await promise;

      setCart([]);
      setCustomer({ ...guestCustomer });
      setCustomerSearchQuery("");
      setPaymentMethod("cash");
      setPaymentDetails("");
      setIsSummaryOpen(false);
      void loadData();
    } catch (error) {
      console.error("Failed to place order", error);
      Toast.error("Unable to place the order. Please try again.");
    }
  };

  const isCashPayment = paymentMethod === "cash" || paymentMethod === "loyalty";
  const parsedPaymentDetails = Number(paymentDetails) || 0;
  const changeDue = isCashPayment ? parsedPaymentDetails - totals.grandTotal : 0;
  const isChangeNegative = isCashPayment && changeDue < 0;

  const paymentInputType = isCashPayment ? "number" : "text";

  const receiptData = useMemo<ReceiptBill | null>(() => {
    if (cart.length === 0) {
      return null;
    }

    const items = cart
      .map((product) => {
        const quantity = Number(product.quantity ?? 0);
        if (quantity <= 0) {
          return null;
        }
        const unitPrice = Number(product.variant.retail_price ?? 0);
        const discountPerUnit = Number(product.variant.discount ?? 0);
        const discountedPrice = Math.max(unitPrice - discountPerUnit, 0);

        return {
          name: product.product_name ?? "Unnamed Product",
          qty: quantity,
          price: unitPrice,
          discountedPrice,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    if (items.length === 0) {
      return null;
    }

    const isGuestCustomer = customer.customer_name === guestCustomer.customer_name;

    const cashReceived = isCashPayment ? Math.max(parsedPaymentDetails, 0) : undefined;

    const branchLabel =
      typedUser?.branch_id !== undefined && typedUser.branch_id !== null ? `Branch ${typedUser.branch_id}` : undefined;

    return {
      shopName: branchLabel ?? "Smart POS",
      address: undefined,
      phone: undefined,
      customer: customer.customer_name,
      loyaltyPoints: isGuestCustomer ? undefined : Number(customer.rewards_points ?? 0),
      loyaltyEarned: rewardsPoints > 0 ? rewardsPoints : undefined,
      credit: undefined,
      invoiceNo: undefined,
      date: new Date().toLocaleString(),
      items,
      discount: 0,
      cash: cashReceived,
      paymentMethod,
      reference: !isCashPayment && paymentDetails ? paymentDetails : undefined,
      footer: "Thank you for shopping with us!",
    };
  }, [
    cart,
    customer.customer_name,
    customer.rewards_points,
    isCashPayment,
    parsedPaymentDetails,
    paymentDetails,
    paymentMethod,
    rewardsPoints,
    typedUser?.branch_id,
  ]);

  // Variant Handlers
  const handleVariantSelection = (product: ProductDetails) => {
    setPendingVariantProduct(product);
    setVariantModel(true);
  };

  const handleVariantModelChange = (open: boolean) => {
    setVariantModel(open);
    if (!open) {
      setPendingVariantProduct(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-row gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="flex-4 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg font-semibold">Add Items</CardTitle>
              <div className="w-full max-w-lg">
                <Input
                  id="product-search"
                  className="h-12 text-2xl"
                  value={productSearchQuery}
                  onChange={(event) => handleProductSearch(event.target.value)}
                  placeholder="Search products (name or barcode)"
                />
              </div>
            </CardHeader>
            <CardContent>
              <SaleStockTable
                products={filteredProducts}
                onSort={handleSort}
                sortColumn={sortColumn}
                onSelect={handleVariantSelection}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg font-semibold">Cart</CardTitle>
              <Button variant="destructive" size="sm" onClick={handleClearCart} disabled={cart.length === 0}>
                Clear Cart
              </Button>
            </CardHeader>
            <CardContent>
              <SaleCartTable onSort={handleSort} sortColumn={cartSortColumn} />
            </CardContent>
          </Card>
        </div>

        <div className="flex-1 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg font-semibold">Customer Info</CardTitle>
              <Button size="sm" onClick={handleAddCustomer}>
                Add New Customer
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="customer-search" className="sr-only">
                  Search customers
                </Label>
                <Input
                  id="customer-search"
                  ref={customerSearchInputRef}
                  value={customerSearchQuery}
                  onChange={(event) => handleCustomerSearch(event.target.value)}
                  onFocus={() => setCustomerSearchFocused(true)}
                  onBlur={() => setCustomerSearchFocused(false)}
                  placeholder="Search customers (name or contact)"
                />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Customer Name</span>
                  <span>{customer.customer_name}</span>
                </div>
                {customer.customer_name !== guestCustomer.customer_name && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Contact</span>
                      <span>{customer.customer_phone ?? "-"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total Loyalty Points</span>
                      <span>{customer.rewards_points}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Credits</span>
                      <span>Rs. {customer.credits}</span>
                    </div>
                  </>
                )}
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Cashier</span>
                  <span>{typedUser?.employee_name ?? "N/A"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Quantity</span>
                  <span>{totals.quantity}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Sub Total</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span>{formatCurrency(totals.discount)}</span>
                </div>
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between text-base font-semibold">
                  <span>Grand Total</span>
                  <span>{formatCurrency(totals.grandTotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">New Loyalty Points</span>
                  <span>{rewardsPoints.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map(({ label, value, disabled }) => (
                  <Button
                    key={value}
                    variant={paymentMethod === value ? "default" : "outline"}
                    onClick={() => paymentHandler(value)}
                    disabled={disabled}
                    className="w-full"
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-details">{isCashPayment ? "Cash Given" : "Reference Number"}</Label>
                <Input
                  id="payment-details"
                  type={paymentInputType}
                  placeholder={isCashPayment ? "Enter amount received" : "Enter reference"}
                  value={paymentDetails}
                  onChange={(event) => setPaymentDetails(event.target.value)}
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="order-comment">Comment</Label>
                <textarea
                  id="order-comment"
                  name="order-comment"
                  placeholder="Optional note for this order"
                  className="min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <Dialog open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
                <DialogTrigger asChild>
                  <Button disabled={!validateOrder()} className="w-full py-6 text-lg font-semibold">
                    Bill
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Bill Summary</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 text-sm">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Cashier</span>
                        <span>{typedUser?.employee_name ?? "N/A"}</span>
                      </div>
                      {customer.customer_name !== guestCustomer.customer_name && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Customer</span>
                          <span>{customer.customer_name}</span>
                        </div>
                      )}
                    </div>
                    <Separator />
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Total Quantity</span>
                        <span>{totals.quantity}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Sub Total</span>
                        <span>{formatCurrency(totals.subtotal)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Discount</span>
                        <span>{formatCurrency(totals.discount)}</span>
                      </div>
                      <div className="flex items-center justify-between font-semibold">
                        <span>Grand Total</span>
                        <span>{formatCurrency(totals.grandTotal)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">New Loyalty Points</span>
                        <span>{rewardsPoints.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Payment Method</span>
                        <span>{paymentMethod}</span>
                      </div>
                      {isCashPayment && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Cash Given</span>
                          <span>{formatCurrency(parsedPaymentDetails)}</span>
                        </div>
                      )}
                    </div>
                    {isCashPayment && (
                      <>
                        <Separator />
                        <div className="flex items-center justify-between text-base font-semibold">
                          <span>Change Due</span>
                          <span>{formatCurrency(changeDue)}</span>
                        </div>
                        {isChangeNegative && (
                          <p className="text-sm text-destructive">Received amount is less than the grand total.</p>
                        )}
                      </>
                    )}
                  </div>
                  <DialogFooter className="gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={isChangeNegative || !receiptData}
                      onClick={() => {
                        if (!receiptData) return;
                        receiptPrinterRef.current?.print();
                      }}
                    >
                      Print Receipt
                    </Button>
                    <Button type="button" onClick={handlePlaceOrder} disabled={isChangeNegative}>
                      Get Next Order
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>
      <VariantSelectionModel
        open={variantModel}
        onOpenChange={handleVariantModelChange}
        product={pendingVariantProduct}
        onSelect={onAddToCart}
      />
      <ReceiptPrinter ref={receiptPrinterRef} bill={receiptData} />
    </div>
  );
};

export default CashierSalePage;
