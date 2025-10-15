export type Identifier = string | number;

export interface Customer {
  customer_id?: Identifier;
  customer_name: string;
  customer_phone?: string;
  customer_contact?: string;
  customer_email?: string;
  rewards_points: number;
  [key: string]: unknown;
}

export interface Product {
  product_id: Identifier;
  product_name: string;
  product_desc?: string;
  category_id?: Identifier;
  supplier_id?: Identifier;
  retail_price: number;
  buying_price?: number;
  discount?: number;
  product_barcode?: string;
  product_image?: string | string[];
  removed?: boolean;
  quantity?: number;
  [key: string]: unknown;
}

export interface InventoryItem {
  inventory_id?: Identifier;
  product_id: Identifier;
  branch_id?: Identifier;
  quantity: number;
  [key: string]: unknown;
}

export interface Supplier {
  supplier_id?: Identifier;
  supplier_name?: string;
  contact_person?: string;
  contact_number?: string;
  email?: string;
  address?: string;
  [key: string]: unknown;
}

export interface Employee {
  employee_id?: Identifier;
  employee_name?: string;
  role_id?: Identifier;
  branch_id?: Identifier;
  employee_email?: string;
  employee_contact?: string;
  [key: string]: unknown;
}

export interface WorkingHourRecord {
  record_id?: Identifier;
  employee_id: Identifier;
  branch_id?: Identifier;
  date: string;
  shift_on?: string;
  shift_off?: string;
  total_hours?: number;
  present?: boolean;
  [key: string]: unknown;
}

export interface RewardsPointsSetting {
  variable_name?: string;
  variable_value: number;
  [key: string]: unknown;
}

export interface AccessPermission {
  access_type_id: number;
  access_name: string;
}

export interface Branch {
  branch_id?: Identifier;
  branch_name?: string;
  address?: string;
  contact_number?: string;
  [key: string]: unknown;
}

export interface Category {
  category_id?: Identifier;
  category_name: string;
  [key: string]: unknown;
}

export type GenericPayload = Record<string, unknown>;
