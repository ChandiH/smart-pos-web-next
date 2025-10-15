import http from "./httpService";
import type { Category, Identifier } from "./types";

const RESOURCE = "/inventory/category";

export const getCategories = () => http.get<Category[]>(RESOURCE);

export const getCategory = (id: Identifier) =>
  http.get<Category>(`${RESOURCE}/${id}`);

export const addCategory = (name: string) =>
  http.post<Category>(RESOURCE, { category_name: name });
