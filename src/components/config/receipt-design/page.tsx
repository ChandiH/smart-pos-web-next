"use client";

import { useEffect, useState } from "react";

import ReceiptPreview from "@/components/receipt/ReceiptPreview";
import ReceiptEditor from "@/components/receipt/ReceiptEditor";
import {
  defaultReceipt,
  ReceiptDesign,
} from "@/components/receipt/receipt-default";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  getReceiptDesign,
  updateReceiptDesign,
} from "@/services/receiptDesignService";

export default function ReceiptDesigner() {
  const [design, setDesign] = useState<ReceiptDesign>(defaultReceipt);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const { data } = await getReceiptDesign();

      setDesign({
        shopName: data.shopName ?? "",
        address: data.address ?? "",
        phone: data.phone ?? "",
        footer: data.footer ?? "",
        logo: data.logo ?? "",

        showAddress: data.showAddress ?? true,
        showPhone: data.showPhone ?? true,
        showCashier: data.showCashier ?? true,
        showCustomer: data.showCustomer ?? true,
        showPoints: data.showPoints ?? true,
        showCredits: data.showCredits ?? true,
        showDiscount: data.showDiscount ?? true,
        showLogo: data.showLogo ?? true,

        fontSize: data.fontSize ?? 14,
      });
    } catch (error) {
      console.error("Failed to load receipt design", error);
    }
  };

  const save = async () => {
    try {
      await updateReceiptDesign({
        shopName: design.shopName,
        address: design.address,
        phone: design.phone,
        footer: design.footer,
        logo: design.logo,

        showAddress: design.showAddress,
        showPhone: design.showPhone,
        showCashier: design.showCashier,
        showCustomer: design.showCustomer,
        showPoints: design.showPoints,
        showCredits: design.showCredits,
        showDiscount: design.showDiscount,
        showLogo: design.showLogo,

        fontSize: design.fontSize,
      });

      alert("Receipt design saved successfully.");
    } catch (error) {
      console.error(error);
      alert("Failed to save receipt design.");
    }
  };

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <Card className="p-6">
        <h2 className="mb-6 text-xl font-bold">
          Receipt Settings
        </h2>

        <ReceiptEditor
          design={design}
          setDesign={setDesign}
        />

        <Button
          className="mt-6 w-full"
          onClick={save}
        >
          Save Design
        </Button>
      </Card>

      <div>
        <h2 className="mb-6 text-xl font-bold">
          Live Preview
        </h2>

        <ReceiptPreview design={design} />
      </div>
    </div>
  );
}