import { InsertSalesPayload } from "@/types/sale-types";
import http from "./httpService";

const RESOURCE = "/print/receipt";

export const sendToPrint = async (data: InsertSalesPayload) => http.post(`${RESOURCE}`, { salesData: data });

export async function sendDrawerOnly() {
  return http.post("/print/drawer");  // or your route path
}