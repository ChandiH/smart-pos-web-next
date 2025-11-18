import http from "./httpService";
import type { GenericPayload, RewardsPointsSetting } from "./types";
import { InsertSalesPayload } from "@/types/sale-types";

const RESOURCE = "/cart";

export const submitOrder = async (data: InsertSalesPayload) => http.post(`${RESOURCE}/insert`, { salesData: data });

export const getRewardsPointsPercentage = async () => {
  const response = await http.get<{ data: RewardsPointsSetting }>(`${RESOURCE}/rewards-points-percentage`);
  return response.data;
};

export const updateRewardsPointsPercentage = async (data: GenericPayload) => {
  const response = await http.put(`${RESOURCE}/rewards-points-percentage`, data);
  return response.data;
};
