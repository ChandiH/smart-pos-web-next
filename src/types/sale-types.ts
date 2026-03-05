export interface SalesOrderDetails {
  customer_id?: string;
  cashier_id: string;
  total_amount: number | string;
  payment_method: string | null;
  reference: string | null;
  branch_id: string;
  rewards_points?: number | string | null;
  product_count?: number | string;
  credit_payment?: number | string | null;
}

export interface SalesProductLine {
  product_id: string;
  variant_id: string;
  quantity: number | string;
}

export interface InsertSalesPayload {
  order: SalesOrderDetails;
  products: SalesProductLine[];
}
