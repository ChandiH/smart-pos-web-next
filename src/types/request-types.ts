import { Supplier } from "./prisma-types";

export type SupplierGetRequest = Pick<Supplier, "supplier_id">;
export type SupplierAddRequest = Omit<Supplier, "supplier_id">;
