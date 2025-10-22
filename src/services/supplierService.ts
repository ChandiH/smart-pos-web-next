import http from "./httpService";
import type { GenericPayload, Identifier, Supplier } from "./types";

const RESOURCE = "/supplier";

export const getSuppliers = async () => {
  const response = await http.get<{ data: Supplier[] }>(RESOURCE);
  return response.data;
};

export const getSupplier = async (id: Identifier) => {
  const response = await http.get<{ data: Supplier }>(`${RESOURCE}/${id}`);
  return response.data;
};

export const addSupplier = async (supplier: GenericPayload) => {
  const response = await http.post<{ data: Supplier }>(RESOURCE, supplier);
  return response.data;
};
