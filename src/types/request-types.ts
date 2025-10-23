import { Category, Customer, Product, Supplier } from "./prisma-types";

// Request types for Supplier operations
export type SupplierGetRequest = Pick<Supplier, "supplier_id">;
export type SupplierAddRequest = Omit<Supplier, "supplier_id">;

// Request types for Customer operations
export type CustomerGetRequest = Pick<Customer, "customer_id">;
export type CustomerAddRequest = Omit<Customer, "customer_id" | "visit_count" | "created_at" | "rewards_points">;

// Request types for Customer operations
export type ProductGetRequest = Pick<Product, "product_id">;
export type ProductAddRequest = Omit<Product, "product_id" | "created_at" | "updated_on" | "removed" | "product_image">;

// Request types for Category operations
export type CategoryGetRequest = Pick<Category, "category_id">;
export type CategoryAddRequest = Omit<Category, "category_id">;
