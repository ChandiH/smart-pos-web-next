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
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Separator, Toast } from "@/components/ui";
import useBarcodeScanner from "@/hooks/useBarcodeScanner";
import ReceiptPrinter, { ReceiptBill, ReceiptPrinterHandle } from "@/components/print/ReceiptPrinter";
import VariantSelectionModel from "@/components/sale/VariantSelectionModel";
import BillSummaryDialog from "@/components/sale/BillSummaryDialog";
import { InsertSalesPayload, SalesOrderDetails, SalesProductLine } from "@/types/sale-types";
import { Customer, Product_Variant, ProductDetails } from "@/types/prisma-types";
import { SortDirection } from "@/types/common-types";
import { sendToPrint } from "@/services/printerService";

type SortColumn = {
  path: string;
  order: SortDirection;
};

type PaymentMethod = "cash" | "debitCard" | "credit" | "loyalty";

export type OrderSummary = {
  customer: Customer | null;
  totals: {
    quantity: number;
    subtotal: number;
    discount: number;
    grandTotal: number;
  };
  rewardsPoints?: number;
  paymentMethod: PaymentMethod;
  paymentDetails: string;
  creditRepayment?: string;
};

const formatCurrency = (value: number) => `Rs. ${Number.isFinite(value) ? value.toFixed(2) : "0.00"}`;

const CashierSalePage = () => {
  const router = useRouter();
  const { currentUser } = useContext(UserContext);
  const { cart, setCart } = useContext(CartContext);
  const [products, setProducts] = useState<ProductDetails[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [isCustomerSearchFocused, setCustomerSearchFocused] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [paymentDetails, setPaymentDetails] = useState("");
  const [creditRepayment, setCreditRepayment] = useState("");
  const [rewardsPointsPercentage, setRewardsPointsPercentage] = useState(0);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [variantModel, setVariantModel] = useState<boolean>(false);
  const [pendingVariantProduct, setPendingVariantProduct] = useState<ProductDetails | null>(null);

  const customerSearchInputRef = useRef<HTMLInputElement | null>(null);
  const receiptPrinterRef = useRef<ReceiptPrinterHandle | null>(null);

  const [scannerMode, setScannerMode] = useState<"auto" | "customer" | "product">("auto");

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

  const paymentMethods: {
    label: string;
    value: PaymentMethod;
    disabled?: boolean;
  }[] = useMemo(() => {
    return [
      { label: "Cash", value: "cash" },
      { label: "VISA/Master Card", value: "debitCard" },
      { label: "Credit Payment", value: "credit", disabled: !customer },
      { label: "Loyalty", value: "loyalty", disabled: true /* TODO: Disabled for now */ },
    ];
  }, [customer]);

  const loadData = useCallback(async () => {
    if (!currentUser?.branch_id) return;

    try {
      const [{ data: rewards }, { data: customerList }, { data: productList }] = await Promise.all([
        getRewardsPointsPercentage(),
        getCustomers(),
        getInventoryWithProduct(),
      ]);

      const availableProducts = (Array.isArray(productList) ? productList : []).filter((product) => !product.removed);
      setProducts(availableProducts);
      setCustomers(customerList);

      const percentage = Number(rewards?.variable_value ?? 0);
      setRewardsPointsPercentage(Number.isFinite(percentage) ? percentage : 0);
    } catch (error) {
      console.error("Failed to load cashier data", error);
      Toast.error("Unable to load cashier data. Please try again.");
    }
  }, [currentUser?.branch_id]);

  useEffect(() => {
    if (!customer) {
      setPaymentMethod("cash");
    }
  }, [customer]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleScannedValue = (barcode: string) => {
    const cleaned = String(barcode ?? "").trim();
    if (!cleaned) return;

    const matchedProduct = products.find((p) => {
      const raw = p.product_barcode;
      if (raw === undefined || raw === null) return false;
      return String(raw).trim() === cleaned;
    });

    if (matchedProduct) {
      console.log("Detected product (priority):", cleaned, "=> productId:", matchedProduct.product_id);
      setProductSearchQuery(cleaned);
      setCustomerSearchFocused(false);
      try {
        handleVariantSelection(matchedProduct);
      } catch (error) {
      }
      return;
    }

    // 👉 Exactly 10 digits → customer
    if (/^\d{10}$/.test(cleaned)) {
      console.log("Detected 10-digit customer barcode:", cleaned);
      setCustomerSearchQuery(cleaned);
      setCustomerSearchFocused(false);
      return;
    }

    // 👉 Otherwise → product
    console.log("Detected product barcode:", cleaned);
    setProductSearchQuery(cleaned);
    setCustomerSearchFocused(false);
  };

  useBarcodeScanner<Customer>({
    enabled: (scannerMode === "customer" || (scannerMode === "auto" && isCustomerSearchFocused)) && customers.length > 0,
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
      //customerSearchInputRef.current?.blur();
      setScannerMode("product");
      setCustomerSearchFocused(false);
      try {
        customerSearchInputRef.current?.blur();
      } catch (error) {
        // ignore if DOM can't blur right now
      }
    },
    onScanFailure: (scannedBarcode) => {
      const normalizedBarcode = scannedBarcode.trim();
      console.log("[BarcodeScanner][Customer] No match", {
        barcode: normalizedBarcode,
      });
      handleScannedValue(scannedBarcode);
      //setCustomerSearchQuery(normalizedBarcode);
      //setCustomer(null);
      //Toast.error("No customer matches the scanned barcode.");
    },
  });

  useBarcodeScanner<ProductDetails>({
    enabled: (scannerMode === "product" || (scannerMode === "auto" && !isCustomerSearchFocused)) && products.length > 0,
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
      handleScannedValue(scannedBarcode);
      //setProductSearchQuery(normalizedBarcode);
      //Toast.error("No product matches the scanned barcode.");
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
      setCustomer(null);
      return;
    }

    const normalizedQuery = query.trim();
    const lowerQuery = normalizedQuery.toLowerCase();

    const filteredCustomer = customers.find((item) => {
      const matchesName = item.customer_name?.toLowerCase().startsWith(lowerQuery);
      const matchesPhone = item.customer_phone && String(item.customer_phone).trim() === normalizedQuery;

      return Boolean(matchesName || matchesPhone);
    });

    setCustomer(filteredCustomer ?? null);
  };

  /* --- 🔧 FIXED: Auto-run customer search on barcode scan --- */
  useEffect(() => {
    if (!customerSearchQuery) {
      setCustomer(null);
      return;
    }

    const normalizedQuery = customerSearchQuery.trim();
    const lowerQuery = normalizedQuery.toLowerCase();

    const filteredCustomer = customers.find((item) => {
      const matchesName = item.customer_name?.toLowerCase().startsWith(lowerQuery);
      const matchesPhone =
        item.customer_phone && String(item.customer_phone).trim() === normalizedQuery;

      return Boolean(matchesName || matchesPhone);
    });

    setCustomer(filteredCustomer ?? null);
  }, [customerSearchQuery, customers]);
  /* ----------------------------------------------------------- */

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

    const subtotalRounded = Number(subtotal.toFixed(2));
    const discountRounded = Number(discount.toFixed(2));
    const grandTotal = Number(Math.max(subtotalRounded - discountRounded, 0).toFixed(2));

    return {
      quantity,
      subtotal: subtotalRounded,
      discount: discountRounded,
      grandTotal,
    };
  }, [cart]);

  const rewardsPoints = useMemo(() => {
    if (!customer) {
      return 0;
    }

    const points = (totals.grandTotal * rewardsPointsPercentage) / 100;
    return Number(points.toFixed(2));
  }, [customer, totals.grandTotal, rewardsPointsPercentage]);

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

  const validateOrder = () => {
      if (cart.length === 0) return false;
      const hasCustomer = Boolean(customer);
      const cash = Number(paymentDetails);
      return ( 
        (paymentMethod === "cash" && (hasCustomer || cash > 0)) ||                    
        (paymentMethod === "debitCard" && cash > 0) ||                                
        ((paymentMethod === "credit" || paymentMethod === "loyalty") && hasCustomer)
      );
    };

  const paymentHandler = (method: PaymentMethod) => {
    if (paymentMethod === method) return;
    setPaymentMethod(method);
    setPaymentDetails("");
    setCreditRepayment("");
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleAddCustomer = () => {
    router.push("/customers/new");
  };

  const handlePlaceOrder = async () => {
    if (!validateOrder()) return;
    if (!currentUser?.employee_id || !currentUser?.branch_id) {
      Toast.error("Missing cashier information. Please sign in again.");
      return;
    }

    const order: SalesOrderDetails = {
      customer_id: customer && customer.customer_id !== 0 ? customer.customer_id : undefined,
      cashier_id: currentUser.employee_id,
      total_amount: totals.grandTotal.toFixed(2),
      payment_method: paymentMethod,
      reference: paymentDetails,
      branch_id: currentUser.branch_id,
      rewards_points: rewardsPoints.toFixed(2),
      product_count: totals.quantity,
      credit_payment: paymentMethod === "credit" ? creditRepayment || "0" : undefined,
    };

    const orderedProducts: SalesProductLine[] = cart.map((product) => ({
      product_id: product.product_id,
      quantity: product.quantity,
      variant_id: product.variant.variant_id,
    }));

    const payload: InsertSalesPayload = {
      order,
      products: orderedProducts,
    };

    try {
      const promise = submitOrder(payload);

      Toast.promise(promise, {
        success: "Order placed",
        error: (error) => error.response?.data?.error ?? "Failed to place order",
      });

      await promise;

      setCart([]);
      setCustomer(null);
      setCustomerSearchQuery("");
      setPaymentMethod("cash");
      setPaymentDetails("");
      setCreditRepayment("");
      setIsSummaryOpen(false);
      void loadData();
    } catch (error) {
      console.error("Failed to place order", error);
      Toast.error("Unable to place the order. Please try again.");
    }
  };

  const handlePrintOrder = async () => {
    if (!validateOrder()) return;
    if (!currentUser?.employee_id || !currentUser?.branch_id) {
      Toast.error("Missing cashier information. Please sign in again.");
      return;
    }

    const order: SalesOrderDetails = {
      customer_id: customer && customer.customer_id !== 0 ? customer.customer_id : undefined,
      cashier_id: currentUser.employee_id,
      total_amount: totals.grandTotal.toFixed(2),
      payment_method: paymentMethod,
      reference: paymentDetails,
      branch_id: currentUser.branch_id,
      rewards_points: rewardsPoints.toFixed(2),
      product_count: totals.quantity,
      credit_payment: paymentMethod === "credit" ? creditRepayment || "0" : undefined,
    };

    const orderedProducts: SalesProductLine[] = cart.map((product) => ({
      product_id: product.product_id,
      quantity: product.quantity,
      variant_id: product.variant.variant_id,
    }));

    const payload: InsertSalesPayload = {
      order,
      products: orderedProducts,
    };

    try {
      const promise = sendToPrint(payload);

      Toast.promise(promise, {
        success: "Order Printed",
        error: (error) => error.response?.data?.error ?? "Failed to print order",
      });

      await promise;
    } catch (error) {
      console.error("Failed to print order", error);
      Toast.error("Unable to print the order. Please try again.");
    }
  };

  const isCashPayment = paymentMethod === "cash" || paymentMethod === "loyalty";
  const parsedPaymentDetails = Number(paymentDetails) || 0;

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

    const isGuestCustomer = !customer;

    const cashReceived = isCashPayment ? Math.max(parsedPaymentDetails, 0) : undefined;

    const branchLabel =
      currentUser?.branch_id !== undefined && currentUser.branch_id !== null
        ? `Branch ${currentUser.branch_id}`
        : undefined;

    return {
      shopName: branchLabel ?? "Smart POS",
      address: undefined,
      phone: undefined,
      customer: customer ? customer.customer_name : undefined,
      loyaltyPoints: isGuestCustomer ? undefined : Number(customer?.rewards_points ?? 0),
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
    customer,
    isCashPayment,
    parsedPaymentDetails,
    paymentDetails,
    paymentMethod,
    rewardsPoints,
    currentUser?.branch_id,
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

  const orderSummary: OrderSummary = useMemo(
    () => ({
      customer,
      totals,
      rewardsPoints: Number(rewardsPoints) || 0,
      paymentMethod,
      paymentDetails,
      creditRepayment,
    }),
    [customer, totals, rewardsPoints, paymentMethod, paymentDetails, creditRepayment]
  );

  const billButtonDisabled = useMemo(() => {
    if (cart.length === 0) {
      return true;
    }
    if (paymentMethod === "cash" && !customer && parsedPaymentDetails < totals.grandTotal) {
      return true;
    }
    if (
      paymentMethod === "credit" &&
      (!customer || parsedPaymentDetails <= Number(creditRepayment) + Number(totals.grandTotal))
    ) {
      return true;
    }

    return false;
  }, [cart.length, paymentMethod, customer, parsedPaymentDetails, totals.grandTotal, creditRepayment]);

  // -----------------------------
  // Global keyboard handlers
  // -----------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ignore if modifier keys used
      if (e.altKey || e.metaKey) return;

      // -----------------------------
      // PAYMENT SHORTCUTS
      // -----------------------------
      if (e.key === "F1") {
        e.preventDefault();
        paymentHandler("cash");
        return;
      }
      if (e.key === "F2") {
        e.preventDefault();
        paymentHandler("debitCard");
        return;
      }
      if (e.key === "F3") {
        e.preventDefault();
        if (customer) paymentHandler("credit");
        return;
      }

      // -----------------------------
      // NUMPAD + → Add/Confirm product
      // -----------------------------
      if (e.code === "NumpadAdd") {
        e.preventDefault();

        // No variant modal → add first filtered product
        if (!variantModel && filteredProducts.length > 0) {
          handleVariantSelection(filteredProducts[0]);
          return;
        }

        // Only one product filtered → select it
        if (document.activeElement?.id === "product-search" && filteredProducts.length === 1) {
          handleVariantSelection(filteredProducts[0]);
        }

        return;
      }

      // -----------------------------
      // ENTER → Navigation flow
      // -----------------------------
      if (e.key === "Enter") {
        e.preventDefault();
        const current = document.activeElement?.id;

        if (current === "product-search") {
          document.getElementById("customer-search")?.focus();
        } else if (current === "customer-search") {
          document.getElementById("payment-details-reference")?.focus();
        } else if (paymentMethod === "credit" && current === "payment-details-reference") {
          document.getElementById("credit-repayment")?.focus();
        } else if (current === "credit-repayment" || current === "payment-details-reference") {
          document.getElementById("bill-button")?.focus();
        } else {
          document.getElementById("product-search")?.focus();
        }

        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    filteredProducts,
    variantModel,
    pendingVariantProduct,
    paymentMethod,
    customer
  ]);

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
                  onFocus={() => {
                    setCustomerSearchFocused(true);
                    setScannerMode("auto");
                  }}
                  onBlur={() => {
                    setCustomerSearchFocused(false);
                    setScannerMode("auto");
                  }}
                  placeholder="Search customers (name or contact)"
                />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Customer Name</span>
                  <span>{customer?.customer_name ?? "Guest Customer"}</span>
                </div>
                {customer && (
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
                  <span>{currentUser?.employee_name ?? "N/A"}</span>
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
              {paymentMethod === "cash" && (
                <div className="space-y-2">
                  <Label htmlFor="payment-details">Cash Given</Label>
                  <Input
                    id="payment-details-reference"
                    type={paymentInputType}
                    placeholder={"Cash Given"}
                    value={paymentDetails}
                    onChange={(event) => setPaymentDetails(event.target.value)}
                  />
                </div>
              )}
              {paymentMethod === "debitCard" && (
                <div className="space-y-2">
                  <Label htmlFor="payment-details">Reference Number</Label>
                  <Input
                    id="payment-details-reference"
                    type={paymentInputType}
                    placeholder={"Enter reference"}
                    value={paymentDetails}
                    onChange={(event) => setPaymentDetails(event.target.value)}
                  />
                </div>
              )}
              {paymentMethod === "credit" && (
                <div className="space-y-2">
                  <Label htmlFor="payment-details">Cash Given</Label>
                  <Input
                    id="payment-details-reference"
                    type={paymentInputType}
                    placeholder={"Cash Given"}
                    value={paymentDetails}
                    onChange={(event) => setPaymentDetails(event.target.value)}
                  />
                  <Label htmlFor="credit-repayment">Repayment</Label>
                  <Input
                    id="credit-repayment"
                    type={paymentInputType}
                    placeholder={"Repayment Amount"}
                    value={creditRepayment}
                    onChange={(event) => setCreditRepayment(event.target.value)}
                  />
                </div>
              )}
              <BillSummaryDialog
                open={isSummaryOpen}
                onOpenChange={setIsSummaryOpen}
                orderSummary={orderSummary}
                onSubmit={handlePlaceOrder}
                onPrint={handlePrintOrder}
                triggerButton={
                  <Button id="bill-button" className="w-full py-6 text-lg font-semibold" disabled={billButtonDisabled}>
                    Bill
                  </Button>
                }
              />
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
