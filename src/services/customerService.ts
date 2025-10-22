import http from "./httpService";
import type { Customer, GenericPayload, Identifier } from "./types";

const RESOURCE = "/customer";

export const getCustomers = async () => {
  const response = await http.get<{ data: Customer[] }>(RESOURCE);
  return response.data;
};

export const getCustomer = async (id: Identifier) => {
  const response = await http.get<{ data: Customer }>(`${RESOURCE}/${id}`);
  return response.data;
};

export const addCustomer = async (data: GenericPayload) => {
  const response = await http.post<{ data: Customer }>(RESOURCE, data);
  return response.data;
};

export const findEmail = async (email: string) => {
  const response = await http.get<{ data: Customer }>(
    `${RESOURCE}/email/${encodeURIComponent(email)}`
  );
  return response.data;
};

export const findPhone = async (phone: string) => {
  const response = await http.get<{ data: Customer }>(
    `${RESOURCE}/phone/${encodeURIComponent(phone)}`
  );
  return response.data;
};
