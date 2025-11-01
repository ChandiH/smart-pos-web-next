import http from "./httpService";
import { Category } from "@/types/prisma-types";
import { API_RESPONSE } from "@/types/common-types";
import { CategoryAddRequest, CategoryGetRequest } from "@/types/request-types";

const RESOURCE = "/print-receipt";

export const sendToPrint = async () => {
  const response = await http.post<API_RESPONSE<any>>(RESOURCE, {
    lines: [
      {
        text: "KAST COFFEE",
        align: "C",
        bold: true,
      },
      {
        text: "No. 123, Colombo 03",
        align: "C",
      },
      { hr: true },
      {
        text: "Latte x2              1500.00",
      },
      {
        text: "Croissant x1           450.00",
      },
      {
        hr: true,
      },
      {
        text: "TOTAL                 1950.00",
        bold: true,
      },
      {
        text: "Paid (Cash)           2000.00",
      },
      {
        text: "Change                  50.00",
      },
      {
        hr: true,
      },
      {
        qrcode: "https://yourpos.example/receipt/ABC123",
      },
      {
        text: "Thank you!",
        align: "C",
      },
    ],
  });
  return response.data;
};

export const getCategory = async ({ category_id }: CategoryGetRequest) => {
  const response = await http.get<API_RESPONSE<Category>>(`${RESOURCE}/${category_id}`);
  return response.data;
};

export const addCategory = async (data: CategoryAddRequest) => {
  const response = await http.post<API_RESPONSE<Category>>(RESOURCE, data);
  return response.data;
};
