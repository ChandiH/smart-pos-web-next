import { InsertSalesPayload } from "@/types/sale-types";
import http from "./httpService";

const RESOURCE = "/print-receipt";

export const sendToPrint = async (data: InsertSalesPayload) => http.post(`${RESOURCE}`, { salesData: data });
