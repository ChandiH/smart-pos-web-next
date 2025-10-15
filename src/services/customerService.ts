import http from "./httpService";
import type { Customer, GenericPayload, Identifier } from "./types";

const RESOURCE = "/customer";

export const getCustomers = () => http.get<Customer[]>(RESOURCE);

export const getCustomer = (id: Identifier) =>
  http.get<Customer>(`${RESOURCE}/${id}`);

export const addCustomer = (data: GenericPayload) =>
  http.post<Customer>(RESOURCE, data);

export const findEmail = (email: string) =>
  http.get<Customer>(`${RESOURCE}/email/${encodeURIComponent(email)}`);

export const findPhone = (phone: string) =>
  http.get<Customer>(`${RESOURCE}/phone/${encodeURIComponent(phone)}`);
