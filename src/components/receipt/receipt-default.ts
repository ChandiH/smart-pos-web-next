export interface ReceiptDesign {
  shopName: string;
  address: string;
  phone: string;
  footer: string;
  logo: string;

  showAddress: boolean;
  showPhone: boolean;
  showCashier: boolean;
  showCustomer: boolean;
  showPoints: boolean;
  showCredits: boolean;
  showDiscount: boolean;
  showLogo: boolean;

  fontSize: number;
}

export const defaultReceipt: ReceiptDesign = {
  shopName: "LAABA KADE STORES",
  address: "Main Street",
  phone: "0771234567",
  footer: "Thank you for shopping with us!",
  logo: "",
  showAddress: true,
  showPhone: true,
  showCashier: true,
  showCustomer: true,
  showPoints: true,
  showCredits: true,
  showDiscount: true,
  showLogo: true,
  fontSize: 14,
};