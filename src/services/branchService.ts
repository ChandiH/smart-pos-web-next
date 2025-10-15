import http from "./httpService";
import type { Branch, GenericPayload, Identifier } from "./types";

const RESOURCE = "/branch";

export const getAllBranches = () => http.get<Branch[]>(RESOURCE);

export const getBranch = (id: Identifier) =>
  http.get<Branch>(`${RESOURCE}/${id}`);

export const addBranch = (data: GenericPayload) =>
  http.post<Branch>(RESOURCE, data);
