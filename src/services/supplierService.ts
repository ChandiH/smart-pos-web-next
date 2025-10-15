import http from "./httpService";
import type { GenericPayload, Identifier, Supplier } from "./types";

const RESOURCE = "/supplier";

export const getSuppliers = () => http.get<Supplier[]>(RESOURCE);

export const getSupplier = (id: Identifier) =>
  http.get<Supplier>(`${RESOURCE}/${id}`);

export const addSupplier = (supplier: GenericPayload) =>
  http.post<Supplier>(RESOURCE, supplier);
