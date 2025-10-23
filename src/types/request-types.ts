import { Customer, Supplier } from "./prisma-types";

// Request types for Supplier operations
export type SupplierGetRequest = Pick<Supplier, "supplier_id">;
export type SupplierAddRequest = Omit<Supplier, "supplier_id">;

// Request types for Customer operations
export type CustomerGetRequest = Pick<Customer, "customer_id">;
export type CustomerAddRequest = Omit<Customer, "customer_id" | "visit_count" | "created_at" | "rewards_points">;
