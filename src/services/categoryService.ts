import http from "./httpService";
import type { Category, Identifier } from "./types";

const RESOURCE = "/inventory/category";

export const getCategories = async () => {
  const response = await http.get<{ data: Category[] }>(RESOURCE);
  return response.data;
};

export const getCategory = async (id: Identifier) => {
  const response = await http.get<{ data: Category }>(`${RESOURCE}/${id}`);
  return response.data;
};

export const addCategory = async (name: string) => {
  const response = await http.post<{ data: Category }>(RESOURCE, {
    category_name: name,
  });
  return response.data;
};
