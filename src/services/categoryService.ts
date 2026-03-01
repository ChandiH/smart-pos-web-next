import http from "./httpService";
import { Category } from "@/types/prisma-types";
import { API_RESPONSE } from "@/types/common-types";
import { CategoryAddRequest, CategoryGetRequest } from "@/types/request-types";

const RESOURCE = "/inventory/category";

export const getCategories = async () => {
  const response = await http.get<API_RESPONSE<Category[]>>(RESOURCE);
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
