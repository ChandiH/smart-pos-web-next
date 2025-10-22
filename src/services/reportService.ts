import http from "./httpService";
import type { GenericPayload, Identifier } from "./types";

const RESOURCE = "/chart";

export const getMonthlySale = async (
  yearMonth: string,
  branchId: Identifier
) => {
  const response = await http.get<{ data: GenericPayload }>(
    `${RESOURCE}/${yearMonth}/${branchId}`
  );
  return response.data;
};

export const getSalesHistoryToday = async (branchId: Identifier) => {
  const response = await http.get<{ data: GenericPayload }>(
    `${RESOURCE}/sale_history/${branchId}`
  );
  return response.data;
};

export const getMonthlySummary = async () => {
  const response = await http.get<{ data: GenericPayload }>(
    `${RESOURCE}/monthly_summary`
  );
  return response.data;
};

export const getTopBranches = async (targetMonth: string) => {
  const response = await http.get<{ data: GenericPayload }>(
    `${RESOURCE}/${targetMonth}`
  );
  return response.data;
};
export const getTopEmployees = async (targetMonth: string) => {
  const response = await http.get<{ data: GenericPayload }>(
    `${RESOURCE}/${targetMonth}`
  );
  return response.data;
};

export const getThreeMonths = async () => {
  const response = await http.get<{ data: GenericPayload }>(
    `${RESOURCE}/three/months/now`
  );
  return response.data;
};

export const getTopSellingProducts = async () => {
  const response = await http.get<{ data: GenericPayload }>(
    `${RESOURCE}/top/selling/products`
  );
  return response.data;
};
