import http from "./httpService";
export interface ReceiptDesignResponse {
  shopName: string;
  address: string;
  phone: string;
  footer: string;
  logo: string | null;

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

export const getReceiptDesign = () => {
  return http.get<ReceiptDesignResponse>("/receipt-design");
};

export const updateReceiptDesign = (data: ReceiptDesignResponse) => {
  return http.put("/receipt-design", data);
};