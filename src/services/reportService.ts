import http from "./httpService";
import type { GenericPayload, Identifier } from "./types";

const RESOURCE = "/chart";

export const getMonthlySale = (yearMonth: string, branchId: Identifier) =>
  http.get<GenericPayload>(`${RESOURCE}/${yearMonth}/${branchId}`);

export const getSalesHistoryToday = (branchId: Identifier) =>
  http.get<GenericPayload>(`${RESOURCE}/sale_history/${branchId}`);

export const getMonthlySummary = () =>
  http.get<GenericPayload>(`${RESOURCE}/monthly_summary`);

export const getTopBranches = (targetMonth: string) =>
  http.get<GenericPayload>(`${RESOURCE}/${targetMonth}`);

export const getThreeMonths = () =>
  http.get<GenericPayload>(`${RESOURCE}/three/months/now`);

export const getTopSellingProducts = () =>
  http.get<GenericPayload>(`${RESOURCE}/top/selling/products`);
