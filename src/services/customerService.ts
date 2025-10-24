import http from "./httpService";
import { Customer } from "@/types/prisma-types";
import { CustomerAddRequest, CustomerGetRequest } from "@/types/request-types";
import { API_RESPONSE } from "@/types/common-types";

const RESOURCE = "/customer";

export const getCustomers = async () => {
  const response = await http.get<API_RESPONSE<Customer[]>>(RESOURCE);
  return response.data;
};

export const getCustomer = async ({ customer_id }: CustomerGetRequest) => {
  const response = await http.get<API_RESPONSE<Customer>>(`${RESOURCE}/${customer_id}`);
  return response.data;
};

export const addCustomer = async (customer: CustomerAddRequest) => {
  const response = await http.post<API_RESPONSE<Customer>>(RESOURCE, customer);
  return response.data;
};

export const updateCustomer = async (id: Customer["customer_id"], customer: CustomerAddRequest) => {
  const response = await http.put<API_RESPONSE<Customer>>(`${RESOURCE}/${id}`, customer);
  return response.data;
};
