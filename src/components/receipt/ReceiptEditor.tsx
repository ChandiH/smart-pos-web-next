import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";
import { ReceiptDesign } from "./receipt-default";

export default function ReceiptEditor({
  design,
  setDesign,
}: {
  design: ReceiptDesign;
  setDesign: (d: ReceiptDesign) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="font-medium">Receipt Logo</label>

        {design.logo && (
          <div className="space-y-2">
            <Image
              src={design.logo}
              alt="Receipt Logo"
              width={120}
              height={120}
              className="rounded border object-contain"
            />

            <button
              type="button"
              onClick={() =>
                setDesign({
                  ...design,
                  logo: "",
                  showLogo: false,
                })
              }
              className="text-sm text-red-600 hover:underline"
            >
              Remove Logo
            </button>
          </div>
        )}

        <Input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];

            if (!file) return;

            const reader = new FileReader();

            reader.onload = () => {
              setDesign({
                ...design,
                logo: reader.result as string,
                showLogo: true,
              });
            };

            reader.readAsDataURL(file);
          }}
        />
      </div>

      <Input
        placeholder="Store Name"
        value={design.shopName}
        onChange={(e) =>
          setDesign({
            ...design,
            shopName: e.target.value,
          })
        }
      />

      <Input
        placeholder="Address"
        value={design.address}
        onChange={(e) =>
          setDesign({
            ...design,
            address: e.target.value,
          })
        }
      />

      <Input
        placeholder="Phone"
        value={design.phone}
        onChange={(e) =>
          setDesign({
            ...design,
            phone: e.target.value,
          })
        }
      />

      <Textarea
        placeholder="Footer Message"
        rows={4}
        value={design.footer}
        onChange={(e) =>
          setDesign({
            ...design,
            footer: e.target.value,
          })
        }
      />

      <Input
        type="number"
        value={design.fontSize}
        onChange={(e) =>
          setDesign({
            ...design,
            fontSize: Number(e.target.value),
          })
        }
      />

      <div className="space-y-3">
        
        <label className="flex gap-2 items-center">
          <Checkbox
            checked={design.showLogo}
            onCheckedChange={(v) =>
              setDesign({
                ...design,
                showLogo: !!v,
              })
            }
          />
          Show Logo
        </label>
        
        <label className="flex gap-2">
          <Checkbox
            checked={design.showAddress}
            onCheckedChange={(v) =>
              setDesign({
                ...design,
                showAddress: !!v,
              })
            }
          />
          Address
        </label>

        <label className="flex gap-2">
          <Checkbox
            checked={design.showPhone}
            onCheckedChange={(v) =>
              setDesign({
                ...design,
                showPhone: !!v,
              })
            }
          />
          Phone
        </label>

        <label className="flex gap-2">
          <Checkbox
            checked={design.showCashier}
            onCheckedChange={(v) =>
              setDesign({
                ...design,
                showCashier: !!v,
              })
            }
          />
          Cashier
        </label>

        <label className="flex gap-2">
          <Checkbox
            checked={design.showCustomer}
            onCheckedChange={(v) =>
              setDesign({
                ...design,
                showCustomer: !!v,
              })
            }
          />
          Customer
        </label>

        <label className="flex gap-2">
          <Checkbox
            checked={design.showPoints}
            onCheckedChange={(v) =>
              setDesign({
                ...design,
                showPoints: !!v,
              })
            }
          />
          Reward Points
        </label>

        <label className="flex gap-2">
          <Checkbox
            checked={design.showCredits}
            onCheckedChange={(v) =>
              setDesign({
                ...design,
                showCredits: !!v,
              })
            }
          />
          Credits
        </label>

        <label className="flex gap-2">
          <Checkbox
            checked={design.showDiscount}
            onCheckedChange={(v) =>
              setDesign({
                ...design,
                showDiscount: !!v,
              })
            }
          />
          Discount
        </label>
      </div>
    </div>
  );
}