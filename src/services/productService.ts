import http from "./httpService";
import type { Identifier, Product } from "./types";

const RESOURCE = "/product";

export interface ProductFormPayload extends Partial<Product> {
  product_name: string;
  category_id: Identifier;
  supplier_id: Identifier;
  buying_price: number;
  retail_price: number;
  discount?: number;
  product_desc?: string;
  product_barcode?: string;
}

const createProductFormData = (
  payload: ProductFormPayload,
  files: File[] | FileList
) => {
  const formData = new FormData();

  Array.from(files).forEach((file) => formData.append("files", file));

  formData.append("product_name", payload.product_name);
  formData.append("product_desc", payload.product_desc ?? "");
  formData.append("category_id", String(payload.category_id ?? ""));
  formData.append(
    "product_image",
    payload.product_image !== undefined ? String(payload.product_image) : ""
  );
  formData.append("buying_price", String(payload.buying_price));
  formData.append("retail_price", String(payload.retail_price));
  formData.append("discount", String(payload.discount ?? 0));
  formData.append("supplier_id", String(payload.supplier_id ?? ""));
  formData.append("product_barcode", payload.product_barcode ?? "");

  return formData;
};

export const getProducts = async () => {
  const response = await http.get<{ data: Product[] }>(RESOURCE);
  return response.data;
};

export const getProduct = async (id: Identifier) => {
  const response = await http.get<Product>(`${RESOURCE}/${id}`);
  return response.data;
};

export const getProductWithCategory = async () => {
  const response = await http.get<Product[]>(`${RESOURCE}/withcategory`);
  return response.data;
};

export const getProductsBySupplier = async (supplierId: Identifier) => {
  const response = await http.get<Product[]>(
    `${RESOURCE}/supplier/${supplierId}`
  );
  return response.data;
};

export const saveProduct = async (
  data: ProductFormPayload,
  files: File[] | FileList
) => {
  const response = await http.post<{ data: Product }>(
    RESOURCE,
    createProductFormData(data, files),
    {
      headers: { "content-type": "multipart/form-data" },
    }
  );
  return response.data;
};

export const updateProductDiscount = async (
  productId: Identifier,
  discount: string
) => {
  const response = await http.put<{ data: Product }>(
    `${RESOURCE}/discount/${productId}`,
    { discount }
  );
  return response.data;
};

export const deleteProduct = async (productId: Identifier) => {
  const response = await http.delete<{ data: Product }>(
    `${RESOURCE}/${productId}`
  );
  return response.data;
};
