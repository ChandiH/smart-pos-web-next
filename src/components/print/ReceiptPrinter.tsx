import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";

export type ReceiptItem = {
  name: string;
  qty: number;
  price: number;
  discountedPrice?: number;
};

export type ReceiptBill = {
  shopName: string;
  address?: string;
  phone?: string;
  customer?: string;
  loyaltyPoints?: number;
  loyaltyEarned?: number;
  credit?: number;
  invoiceNo?: string;
  date: string;
  items: ReceiptItem[];
  discount?: number;
  cash?: number;
  paymentMethod?: string;
  reference?: string;
  footer?: string;
};

export type ReceiptPrinterHandle = {
  print: () => void;
};

type ReceiptPrinterProps = {
  bill: ReceiptBill | null;
};

const ReceiptPrinter = forwardRef<ReceiptPrinterHandle, ReceiptPrinterProps>(
  ({ bill }, ref) => {
    const printRef = useRef<HTMLDivElement | null>(null);

    const totals = useMemo(() => {
      if (!bill) {
        return {
          originalSubtotal: 0,
          discountedSubtotal: 0,
          perItemDiscount: 0,
          additionalDiscount: 0,
          totalDiscount: 0,
          total: 0,
        };
      }

      const originalSubtotal = bill.items.reduce(
        (sum, item) => sum + item.price * item.qty,
        0
      );
      const discountedSubtotal = bill.items.reduce(
        (sum, item) =>
          sum +
          (item.discountedPrice !== undefined
            ? item.discountedPrice
            : item.price) *
            item.qty,
        0
      );

      const additionalDiscount = bill.discount ?? 0;
      const perItemDiscount = originalSubtotal - discountedSubtotal;
      const totalDiscount = perItemDiscount + additionalDiscount;
      const total = originalSubtotal - totalDiscount;

      return {
        originalSubtotal,
        discountedSubtotal,
        perItemDiscount,
        additionalDiscount,
        totalDiscount,
        total,
      };
    }, [bill]);

    const handlePrint = useCallback(() => {
      if (typeof window === "undefined" || !bill || bill.items.length === 0) {
        return;
      }
      window.print();
    }, [bill]);

    useImperativeHandle(
      ref,
      () => ({
        print: () => {
          handlePrint();
        },
      }),
      [handlePrint]
    );

    if (!bill || bill.items.length === 0) {
      return null;
    }

    const change = (bill.cash ?? 0) - totals.total;

    return (
      <div
        aria-hidden
        style={{ position: "absolute", top: 0, left: "-9999px" }}
      >
        <style>
          {`@media print {
          body * { visibility: hidden; }
          #pos-print-area, #pos-print-area * { visibility: visible; }
          #pos-print-area { position: absolute; left: 0; top: 0; }
          @page { size: 80mm auto; margin: 0mm; }
        }
        #pos-print-area {
          width: 80mm;
          max-width: 80mm;
          font-family: monospace;
          font-size: 12px;
        }
        .receipt { padding: 6px; }
        .center { text-align: center; }
        .small { font-size: 12px; }
        .tight { line-height: 1.1; }
        .items {
          width: 100%;
          border-top: 1px dashed #000;
          border-bottom: 1px dashed #000;
          margin: 6px 0;
        }
        .items th, .items td {
          padding: 2px 0;
          font-size: 12px;
        }
        .right { text-align: right; }
        .bold { font-weight: 700; }
        .strike { text-decoration: line-through; color: #555; }
        `}
        </style>
        <div id="pos-print-area" ref={printRef}>
          <div className="receipt">
            <div className="center bold" style={{ fontSize: 14 }}>
              {bill.shopName}
            </div>
            {bill.address && (
              <div className="center small tight">{bill.address}</div>
            )}
            {bill.phone && (
              <div className="center small tight">{bill.phone}</div>
            )}
            <div style={{ height: 6 }} />
            <div className="small tight">
              {bill.invoiceNo && (
                <div>
                  Invoice:{" "}
                  <span className="right" style={{ float: "right" }}>
                    {bill.invoiceNo}
                  </span>
                </div>
              )}
              <div>
                Date:{" "}
                <span className="right" style={{ float: "right" }}>
                  {bill.date}
                </span>
              </div>
              {bill.customer && (
                <div>
                  Customer:{" "}
                  <span className="right" style={{ float: "right" }}>
                    {bill.customer}
                  </span>
                </div>
              )}
              {bill.loyaltyPoints !== undefined && (
                <div>
                  Loyalty Balance:{" "}
                  <span className="right" style={{ float: "right" }}>
                    {bill.loyaltyPoints.toFixed(2)}
                  </span>
                </div>
              )}
              {bill.loyaltyEarned !== undefined && (
                <div>
                  Loyalty Earned:{" "}
                  <span className="right" style={{ float: "right" }}>
                    {bill.loyaltyEarned.toFixed(2)}
                  </span>
                </div>
              )}
              {bill.credit !== undefined && (
                <div>
                  Credit:{" "}
                  <span className="right" style={{ float: "right" }}>
                    {bill.credit.toFixed(2)}
                  </span>
                </div>
              )}
              {bill.paymentMethod && (
                <div>
                  Payment:{" "}
                  <span className="right" style={{ float: "right" }}>
                    {bill.paymentMethod}
                  </span>
                </div>
              )}
              {bill.reference && (
                <div>
                  Reference:{" "}
                  <span className="right" style={{ float: "right" }}>
                    {bill.reference}
                  </span>
                </div>
              )}
            </div>
            <table
              className="items"
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginTop: 6,
              }}
            >
              <thead>
                <tr>
                  <th style={{ textAlign: "left", width: "40%" }}>Item</th>
                  <th style={{ textAlign: "center", width: "15%" }}>Qty</th>
                  <th style={{ textAlign: "right", width: "20%" }}>Unit</th>
                  <th style={{ textAlign: "right", width: "25%" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {bill.items.map((item, index) => {
                  const finalPrice =
                    item.discountedPrice !== undefined
                      ? item.discountedPrice
                      : item.price;
                  return (
                    <tr key={`${item.name}-${index}`}>
                      <td style={{ textAlign: "left", wordBreak: "break-word" }}>
                        {item.name}
                      </td>
                      <td style={{ textAlign: "center" }}>{item.qty}</td>
                      <td style={{ textAlign: "right" }}>
                        {item.discountedPrice !== undefined &&
                        item.discountedPrice !== item.price ? (
                          <>
                            <div className="strike">
                              {item.price.toFixed(2)}
                            </div>
                            <div>{finalPrice.toFixed(2)}</div>
                          </>
                        ) : (
                          <div>{finalPrice.toFixed(2)}</div>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {(finalPrice * item.qty).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ marginTop: 6, fontSize: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>Subtotal</div>
                <div>{totals.originalSubtotal.toFixed(2)}</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>Discount</div>
                <div>-{totals.totalDiscount.toFixed(2)}</div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 4,
                }}
              >
                <div>Total</div>
                <div>{totals.total.toFixed(2)}</div>
              </div>
              {bill.cash !== undefined && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 4,
                  }}
                >
                  <div>Received</div>
                  <div>{bill.cash.toFixed(2)}</div>
                </div>
              )}
              {Number.isFinite(change) && bill.cash !== undefined && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 4,
                  }}
                >
                  <div>Change</div>
                  <div>{change.toFixed(2)}</div>
                </div>
              )}
            </div>
            <div
              style={{
                marginTop: 8,
                borderTop: "1px dashed #000",
                paddingTop: 6,
              }}
            >
              <div className="center small tight">
                {bill.footer ?? "Thank you for your purchase!"}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ReceiptPrinter.displayName = "ReceiptPrinter";

export default ReceiptPrinter;
