"use client";
import Image from "next/image";
import { ReceiptDesign } from "./receipt-default";

interface ReceiptPreviewProps {
  design: ReceiptDesign;
}

export default function ReceiptPreview({
  design,
}: ReceiptPreviewProps) {
  return (
    <div
      className="mx-auto bg-white border rounded shadow p-4 font-mono text-black"
      style={{
        width: 340,
        fontSize: design.fontSize,
      }}
    >
      {/* SHOP HEADER */}
      {design.showLogo && design.logo && (

      <div className="flex justify-center mb-3">

      <Image
      src={design.logo}
      alt="Logo"
      width={90}
      height={90}
      className="object-contain"
      />

      </div>

      )}

      <div className="text-center text-2xl font-bold">
        {design.shopName}
      </div>

      {design.showAddress && (
        <div className="text-center">
          {design.address}
        </div>
      )}

      {design.showPhone && (
        <div className="text-center">
          Tel : {design.phone}
        </div>
      )}

      <hr className="my-2 border-dashed" />

      {/* CASHIER */}

      {design.showCashier && (
        <>
          <div className="flex justify-between">
            <span>Cashier: John</span>
            <span>2026-07-26</span>
          </div>

          <div className="flex justify-between">
            <span>Invoice No: INV-000001</span>
            <span>10:45 AM</span>
          </div>

          <hr className="my-2 border-dashed" />
        </>
      )}

      {/* CUSTOMER */}

      {design.showCustomer && (
        <>
          <div>
            Customer : Nimal Perera
          </div>
        </>
      )}

      {/* POINTS */}

      {design.showPoints && (
        <div className="flex justify-between">
          <span>Points Earned : 15</span>
          <span>Balance : 220</span>
        </div>
      )}

      {/* CREDITS */}

      {design.showCredits && (
        <>
          <div className="flex justify-between font-bold">
            <span>Credit Old : 1500.00</span>
            <span>Credit New : 1300.00</span>
          </div>

          <hr className="my-2 border-dashed" />
        </>
      )}

      {/* ITEM HEADER */}

      <div className="grid grid-cols-4 text-right font-bold">
        <div>U.Price</div>
        <div>D.Price</div>
        <div>Qty</div>
        <div>Total</div>
      </div>

      <hr className="my-2 border-dashed" />

      {/* ITEMS */}

      <div className="mb-1">
        Coca Cola 1.5L
      </div>

      <div className="grid grid-cols-4 text-right">
        <div>250.00</div>
        <div>225.00</div>
        <div>2</div>
        <div>450.00</div>
      </div>

      <div className="mt-2">
        Rice 5KG Premium
      </div>

      <div className="grid grid-cols-4 text-right">
        <div>3200.00</div>
        <div>3000.00</div>
        <div>1</div>
        <div>3000.00</div>
      </div>

      <hr className="my-2 border-dashed" />

      {/* SUMMARY */}

      <div className="flex justify-between font-bold">
        <span>TOTAL</span>
        <span>3450.00</span>
      </div>

      <div className="flex justify-between">
        <span>Cash Received</span>
        <span>4000.00</span>
      </div>

      <div className="flex justify-between">
        <span>Change</span>
        <span>550.00</span>
      </div>

      <div className="flex justify-between">
        <span>Payment</span>
        <span>CASH</span>
      </div>

      {/* DISCOUNT */}

      {design.showDiscount && (
        <>
          <hr className="my-2 border-dashed" />

          <div className="text-center font-bold">
            ඔබ ලැබූ ලාභය : 250.00
          </div>
        </>
      )}

      <hr className="my-2 border-dashed" />

      {/* FOOTER */}

      <div className="text-center mt-3 whitespace-pre-line">
        {design.footer}
      </div>
    </div>
  );
}