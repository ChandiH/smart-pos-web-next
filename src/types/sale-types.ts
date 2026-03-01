export interface SalesOrderDetails {
  customer_id?: number | string;
  cashier_id: number | string;
  total_amount: number | string;
  payment_method: string | null;
  reference: string | null;
  branch_id: number | string;
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
