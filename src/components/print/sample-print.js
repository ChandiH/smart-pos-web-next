import React, { useRef } from "react";
// React component to render and print a receipt for thermal printers (e.g. XP-80T)
// Uses window.print() and 80mm receipt layout.
export default function ReceiptPrinter({ bill }) {
  const printRef = useRef();
  function calcTotals(items, discount = 0) {
    const subtotal = items.reduce(
      (s, it) => s + (it.discountedPrice || it.price) * it.qty,
      0
    );
    const total = subtotal - discount;
    return { subtotal, discount, total };
  }
  function handlePrint() {
    window.print();
  }
  const data = bill || {
    shopName: "Demo Shop",
    address: "No 1, Main Street, Colombo",
    phone: "+94 77 123 4567",
    customer: "John Doe",
    loyaltyPoints: 12,
    credit: 0,
    invoiceNo: "INV-0001",
    date: new Date().toLocaleString(),
    items: [
      { name: "Coke 330ml", qty: 2, price: 150, discountedPrice: 140 },
      { name: "Bread", qty: 1, price: 85, discountedPrice: 85 },
      { name: "Chocolate", qty: 3, price: 60, discountedPrice: 55 },
    ],
    discount: 50,
    cash: 1000,
    footer: "Thank you for your purchase!",
  };
  const totals = calcTotals(data.items, data.discount);
  const change = data.cash - totals.total;
  return (
    <div>
      {/* Print styles */}
      <style>
        {`@media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; }
          @page { size: 80mm auto; margin: 0mm; }
        }
        #print-area {
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
      {/* Buttons (not printed) */}
      <div style={{ marginBottom: 12 }}>
        <button
          onClick={handlePrint}
          style={{ padding: "8px 12px", marginRight: 8 }}
        >
          Print Receipt
        </button>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(JSON.stringify(data));
            alert("Copied sample bill JSON");
          }}
        >
          Copy Sample JSON
        </button>
      </div>
      <div id="print-area" ref={printRef}>
        <div className="receipt">
          <div className="center bold" style={{ fontSize: 14 }}>
            {data.shopName}
          </div>
          <div className="center small tight">{data.address}</div>
          <div className="center small tight">{data.phone}</div>
          <div style={{ height: 6 }} />
          <div className="small tight">
            <div>
              Invoice:{" "}
              <span className="right" style={{ float: "right" }}>
                {data.invoiceNo}
              </span>
            </div>
            <div>
              Date:{" "}
              <span className="right" style={{ float: "right" }}>
                {data.date}
              </span>
            </div>
            <div>
              Customer:{" "}
              <span className="right" style={{ float: "right" }}>
                {data.customer}
              </span>
            </div>
            <div>
              Loyalty Points:{" "}
              <span className="right" style={{ float: "right" }}>
                {data.loyaltyPoints}
              </span>
            </div>
            <div>
              Credit:{" "}
              <span className="right" style={{ float: "right" }}>
                {data.credit.toFixed(2)}
              </span>
            </div>
          </div>
          <table
            className="items"
            style={{ width: "100%", borderCollapse: "collapse", marginTop: 6 }}
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
              {data.items.map((it, idx) => (
                <tr key={idx}>
                  <td style={{ textAlign: "left", wordBreak: "break-word" }}>
                    {it.name}
                  </td>
                  <td style={{ textAlign: "center" }}>{it.qty}</td>
                  <td style={{ textAlign: "right" }}>
                    <div className="strike">{it.price.toFixed(2)}</div>
                    <div>{it.discountedPrice.toFixed(2)}</div>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {(it.qty * it.discountedPrice).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 6, fontSize: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>Subtotal</div>
              <div>{totals.subtotal.toFixed(2)}</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>Discount</div>
              <div>-{data.discount.toFixed(2)}</div>
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
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 4,
              }}
            >
              <div>Cash</div>
              <div>{data.cash.toFixed(2)}</div>
            </div>
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
          </div>
          <div
            style={{
              marginTop: 8,
              borderTop: "1px dashed #000",
              paddingTop: 6,
            }}
          >
            <div className="center small tight">{data.footer}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
