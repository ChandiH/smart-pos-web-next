import http from "./httpService";
import type { Branch, GenericPayload, Identifier } from "./types";

const RESOURCE = "/branch";

export const getAllBranches = async () => {
  const response = await http.get<{ data: Branch[] }>(RESOURCE);
  return response.data;
};

export const getBranch = async (id: Identifier) => {
  const response = await http.get<{ data: Branch }>(`${RESOURCE}/${id}`);
  return response.data;
};

export const addBranch = async (data: GenericPayload) => {
  const response = await http.post<{ data: Branch }>(RESOURCE, data);
  return response.data;
};
