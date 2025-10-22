import http from "./httpService";
import type { GenericPayload, Identifier, InventoryItem } from "./types";

const RESOURCE = "/inventory";

export const getInventory = () => http.get<InventoryItem[]>(RESOURCE);

export const getInventoryByProduct = async (id: Identifier) => {
  const response = await http.get<{ data: InventoryItem[] }>(
    `${RESOURCE}/product/${id}`
  );
  return response.data;
};

export const getInventoryByBranch = async (id: Identifier) => {
  const response = await http.get<{ data: InventoryItem[] }>(
    `${RESOURCE}/branch/${id}`
  );
  return response.data;
};

export const updateInventory = async (data: GenericPayload) => {
  const response = await http.post<{ data: InventoryItem }>(RESOURCE, data);
  return response.data;
};
