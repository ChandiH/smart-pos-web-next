import http from "./httpService";
import type { GenericPayload, Identifier, InventoryItem } from "./types";

const RESOURCE = "/inventory";

export const getInventory = () => http.get<InventoryItem[]>(RESOURCE);

export const getInventoryByProduct = (id: Identifier) =>
  http.get<InventoryItem[]>(`${RESOURCE}/product/${id}`);

export const getInventoryByBranch = (id: Identifier) =>
  http.get<InventoryItem[]>(`${RESOURCE}/branch/${id}`);

export const updateInventory = (data: GenericPayload) =>
  http.post<InventoryItem>(RESOURCE, data);
