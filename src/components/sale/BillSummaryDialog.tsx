"use client";

import React, { useContext, useMemo, useEffect, ReactNode } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Separator,
} from "@/components/ui";
import UserContext from "@/context/UserContext";
import { OrderSummary } from "../screens/sale/cashierSalePage";
import { sendDrawerOnly } from "@/services/printerService";

type BillSummaryDialogProps = {
  orderSummary: OrderSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerButton: ReactNode;
  onSubmit: () => void;
  onPrint: () => void;
};

const formatCurrency = (value: number) =>
  `Rs. ${Number.isFinite(value) ? value.toFixed(2) : "0.00"}`;

const BillSummaryDialog = ({
  open,
  onOpenChange,
  orderSummary,
  triggerButton,
  onSubmit,
  onPrint,
}: BillSummaryDialogProps) => {
  const { currentUser } = useContext(UserContext);
  const { totals, rewardsPoints, paymentMethod, paymentDetails, creditRepayment } =
    orderSummary;

  const changeDue = useMemo(() => {
    if (paymentMethod === "cash") {
      return (Number(paymentDetails) || 0) - totals.grandTotal;
    } else if (paymentMethod === "credit") {
      return (Number(paymentDetails) || 0) - ((Number(creditRepayment) || 0) + totals.grandTotal);
    }
    return 0;
  }, [creditRepayment, paymentDetails, paymentMethod, totals.grandTotal]);

  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if (e.altKey || e.metaKey) return;
      // Print receipt: ` key (backtick)
      if (e.code === "Backquote") {
        e.preventDefault();
        onPrint();
      }

      // Next order: Tab key
      if (e.key === "Tab") {
        e.preventDefault();
        handleNextOrder();
      }
    };

    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
  }, [onPrint]);

const handleNextOrder = async () => {
  try {
    await sendDrawerOnly();   // 🔥 drawer only, no print
  } catch (err) {
    console.error("Drawer only failed:", err);
  }
  onSubmit(); 
};


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
          {triggerButton ?? (
            <Button className="w-full py-6 text-lg font-semibold">Bill</Button>
          )}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bill Summary</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Cashier</span>
                <span>{currentUser?.employee_name ?? "N/A"}</span>
              </div>
              {orderSummary.customer && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Customer</span>
                  <span>{orderSummary.customer.customer_name}</span>
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
                <span>{rewardsPoints?.toFixed(2) ?? "0.00"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Payment Method</span>
                <span>{paymentMethod}</span>
              </div>
              {paymentMethod === "cash" && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Cash Given</span>
                  <span>{formatCurrency(Number(paymentDetails))}</span>
                </div>
              )}
              {paymentMethod === "debitCard" && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Reference Number</span>
                  <span>{paymentDetails}</span>
                </div>
              )}
            </div>

            {(paymentMethod === "cash" || paymentMethod === "credit") && (
              <>
                <Separator />
                <div className="flex items-center justify-between text-base font-semibold">
                  <span>Change Due</span>
                  <span>{formatCurrency(changeDue)}</span>
                </div>
              {paymentMethod == "cash" && changeDue < 0 && (
                  <>
                    <div className="w-full border border-red-500 p-1 text-center rounded-md">
                      <p className="text-sm text-destructive">Insufficient cash received</p>
                    </div>
                    <div className="text-sm text-destructive">
                      <p>This Bill will increase customer credits by {formatCurrency(Math.abs(changeDue))}</p>
                    </div>
                  </>
                )}
            </>
          )}
          {paymentMethod == "credit" && (
            <>
              <Separator />
              <div className="flex items-center justify-between text-base font-semibold">
                <span>Change Due</span>
                <span>{formatCurrency(changeDue)}</span>
              </div>
              {paymentMethod == "credit" && creditRepayment && (
                <>
                  <div className="w-full border border-red-500 p-1 text-center rounded-md">
                    <p className="text-sm text-destructive">
                      This Bill will decrease customer credits by {formatCurrency(Number(creditRepayment))}
                    </p>
                  </div>
                </>
                )}
              </>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="secondary" onClick={onPrint}>
              Print Receipt
            </Button>
            <Button type="button" onClick={handleNextOrder}>
              Get Next Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

export default BillSummaryDialog;
