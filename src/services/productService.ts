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
    payload.product_image !== undefined
      ? String(payload.product_image)
      : ""
  );
  formData.append("buying_price", String(payload.buying_price));
  formData.append("retail_price", String(payload.retail_price));
  formData.append("discount", String(payload.discount ?? 0));
  formData.append("supplier_id", String(payload.supplier_id ?? ""));
  formData.append("product_barcode", payload.product_barcode ?? "");

  return formData;
};

export const getProducts = () => http.get<Product[]>(RESOURCE);

export const getProduct = (id: Identifier) =>
  http.get<Product>(`${RESOURCE}/${id}`);

export const getProductWithCategory = () =>
  http.get<Product[]>(`${RESOURCE}/withcategory`);

export const getProductsBySupplier = (supplierId: Identifier) =>
  http.get<Product[]>(`${RESOURCE}/supplier/${supplierId}`);

export const saveProduct = (
  data: ProductFormPayload,
  files: File[] | FileList
) =>
  http.post<Product>(
    RESOURCE,
    createProductFormData(data, files),
    {
      headers: { "content-type": "multipart/form-data" },
    }
  );

export const updateProductDiscount = (
  productId: Identifier,
  discount: number
) =>
  http.put<Product>(`${RESOURCE}/discount/${productId}`, { discount });

export const deleteProduct = (productId: Identifier) =>
  http.delete(`${RESOURCE}/${productId}`);
