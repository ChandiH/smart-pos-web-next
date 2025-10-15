import http from "./httpService";
import type {
  GenericPayload,
  Identifier,
  RewardsPointsSetting,
} from "./types";

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

export const submitOrder = (data: SubmitOrderPayload) =>
  http.post(`${RESOURCE}/insert`, data);

export const getRewardsPointsPercentage = () =>
  http.get<RewardsPointsSetting[]>(`${RESOURCE}/rewards-points-percentage`);

export const updateRewardsPointsPercentage = (data: GenericPayload) =>
  http.put(`${RESOURCE}/rewards-points-percentage`, data);
