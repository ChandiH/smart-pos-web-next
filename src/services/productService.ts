import http from "./httpService";
import { Product, ProductDetails, ProductWithCategory } from "@/types/prisma-types";
import { API_RESPONSE } from "@/types/common-types";
import { ProductAddRequest } from "@/types/request-types";

const RESOURCE = "/product";

export const getProducts = async () => {
  const response = await http.get<API_RESPONSE<ProductWithCategory[]>>(RESOURCE);
  return response.data;
};

export const getProduct = async (id: Product["product_id"]) => {
  const response = await http.get<API_RESPONSE<ProductDetails>>(`${RESOURCE}/${id}`);
  return response.data;
};

export const getProductWithCategory = async () => {
  const response = await http.get<API_RESPONSE<ProductWithCategory[]>>(`${RESOURCE}/withcategory`);
  return response.data;
};

export const getProductsBySupplier = async (supplierId: Product["supplier_id"]) => {
  const response = await http.get<API_RESPONSE<ProductWithCategory[]>>(`${RESOURCE}/supplier/${supplierId}`);
  return response.data;
};

export const addProduct = async (data: ProductAddRequest) => {
  const response = await http.post<API_RESPONSE<Product>>(RESOURCE, data);
  return response.data;
};

export const updateProduct = async (id: Product["product_id"], data: ProductAddRequest) => {
  const response = await http.put<API_RESPONSE<Product>>(`${RESOURCE}/${id}`, data);
  return response.data;
};

export const updateProductDiscount = async (productId: Product["product_id"], discount: string) => {
  const response = await http.put<API_RESPONSE<Product>>(`${RESOURCE}/discount/${productId}`, { discount });
  return response.data;
};

export const deleteProduct = async (productId: Product["product_id"]) => {
  const response = await http.delete<API_RESPONSE<Product>>(`${RESOURCE}/${productId}`);
  return response.data;
};
