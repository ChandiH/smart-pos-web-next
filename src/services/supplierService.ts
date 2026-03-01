import http from "./httpService";
import { API_RESPONSE } from "@/types/common-types";
import { Supplier, SupplierWithProducts } from "@/types/prisma-types";
import { SupplierAddRequest, SupplierGetRequest } from "@/types/request-types";

const RESOURCE = "/supplier";

export const getSuppliers = async () => {
  const response = await http.get<API_RESPONSE<Supplier[]>>(RESOURCE);
  return response.data;
};

export const getSupplier = async ({ supplier_id }: SupplierGetRequest) => {
  const response = await http.get<API_RESPONSE<SupplierWithProducts>>(`${RESOURCE}/${supplier_id}`);
  return response.data;
};

export const addSupplier = async (supplier: SupplierAddRequest) => {
  const response = await http.post<API_RESPONSE<Supplier>>(RESOURCE, supplier);
  return response.data;
};

export const updateSupplier = async (id: Supplier["supplier_id"], supplier: SupplierAddRequest) => {
  const response = await http.put<API_RESPONSE<Supplier>>(`${RESOURCE}/${id}`, supplier);
  return response.data;
};
