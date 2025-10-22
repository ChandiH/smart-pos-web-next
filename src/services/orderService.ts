import http from "./httpService";
import type { GenericPayload, Identifier, RewardsPointsSetting } from "./types";

const RESOURCE = "/cart";

export interface OrderPayload {
  customer_id?: Identifier;
  cashier_id: Identifier;
  total_amount: number | string;
  profit: number | string;
  payment_method_id: Identifier;
  reference_id?: string | number;
  branch_id: Identifier;
  rewards_points?: number | string;
  product_count: number;
  [key: string]: unknown;
}

export interface OrderProductPayload {
  product_id: Identifier;
  quantity: number;
  [key: string]: unknown;
}

export interface SubmitOrderPayload {
  salesData: {
    order: OrderPayload;
    products: OrderProductPayload[];
  };
}

export const submitOrder = async (data: SubmitOrderPayload) =>
  http.post(`${RESOURCE}/insert`, data);

export const getRewardsPointsPercentage = async () => {
  const response = await http.get<{ data: RewardsPointsSetting[] }>(
    `${RESOURCE}/rewards-points-percentage`
  );
  return response.data;
};

export const updateRewardsPointsPercentage = async (data: GenericPayload) => {
  const response = await http.put(
    `${RESOURCE}/rewards-points-percentage`,
    data
  );
  return response.data;
};
