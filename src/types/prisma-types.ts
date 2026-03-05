/**
 * Frontend-safe representations of your Prisma models.
 * Conventions:
 * - Decimal -> MoneyString (e.g., "1234.56") to avoid precision loss in JS numbers.
 * - DateTime/Date/Timestamptz/Timestamp -> ISODateString (e.g., "2025-10-23T12:34:56.000Z")
 * - UUID -> string
 * - Int/Boolean -> number/boolean
 */

export type UUID = string;
export type ISODateString = string; // new Date().toISOString()
export type MoneyString = string; // use string to preserve precision (e.g., "1000.00")

/* =========================
 *  Core Entities (flat)
 * ========================= */

export type AccessType = {
  access_type_id: UUID;
  access_name: string;
};

export type Branch = {
  branch_id: UUID;
  branch_city: string;
  branch_address: string;
  branch_phone: string;
  branch_email: string;
  created_at: ISODateString | null;
};

export type Category = {
  category_id: UUID;
  category_name: string;
};

export type Supplier = {
  supplier_id: UUID;
  supplier_name: string;
  supplier_email: string | null;
  supplier_phone: string;
  supplier_address: string;
};

export type Product = {
  product_id: UUID;
  product_name: string;
  product_desc: string | null;
  category_id: UUID;
  product_image: string[];
  supplier_id: UUID;
  product_barcode: string;
  stock_type: string | null;
  removed: boolean | null;
  created_at: ISODateString | null;
  updated_on: ISODateString | null;
};

export type Product_Variant = {
  variant_id: UUID;
  product_id: UUID;
  label: string;
  buying_price: MoneyString;
  retail_price: MoneyString;
  discount: MoneyString | null;
};

export type Inventory = {
  product_id: UUID;
  branch_id: UUID;
  quantity: number | null;
  reorder_level: number | null;
  updated_on: ISODateString | null;
};

export type PaymentMethod = {
  payment_method_id: UUID;
  payment_method_name: string;
};

export type Customer = {
  customer_id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  customer_address: string | null;
  visit_count: number | null;
  rewards_points: MoneyString | null;
  credits: MoneyString | null;
  created_at: ISODateString | null;
};

export type Employee = {
  employee_id: string;
  employee_name: string;
  role_id: UUID;
  hired_date: ISODateString | null;
  employee_email: string | null;
  employee_phone: string;
  branch_id: UUID;
  employee_image: string | null;
  branch_updated_on: ISODateString | null;
  role_updated_on: ISODateString | null;
};

export type SalesHistory = {
  order_id: UUID;
  customer_id: string | null;
  cashier_id: string | null;
  branch_id: UUID;
  created_at: ISODateString | null;
  total_amount: MoneyString | null;
  profit: MoneyString | null;
  rewards_points: MoneyString | null;
  payment_method_id: UUID | null;
  reference_id: string | null;
  product_count: number | null;
};

export type Cart = {
  cart_id: UUID;
  order_id: UUID | null;
  product_id: UUID;
  quantity: number;
  sub_total_amount: MoneyString | null;
  created_at: ISODateString | null; // this is DATE in DB; still fine to treat as ISO string
};

export type Discount = {
  discount_id: UUID;
  discount_name: string;
  discount_desc: string | null;
  discount_percentage: string; // Decimal(5,2) -> string (e.g., "12.50")
};

export type UserCredentials = {
  user_id: UUID;
  username: string;
  password: string;
  updated_on: ISODateString | null;
};

export type UserRole = {
  role_id: UUID;
  role_name: string;
  role_desc: string;
  user_access: Array<string>;
};

export type VariableOptions = {
  variable_id: UUID;
  variable_name: string;
  created_at: ISODateString | null;
  variable_value: MoneyString | null;
  updated_on: ISODateString | null;
};

export type WorkingHour = {
  branch_id: UUID;
  employee_id: string;
  date: string; // stored as VarChar(12) in DB
  shift_on: string; // VarChar(5)
  shift_off: string; // VarChar(5)
  updated_by: string;
  present: boolean;
  total_hours: string | null; // Decimal(100,2) -> string
};

/* ======================================
 *  Useful Composite / View Models
 * ====================================== */

export type EmployeeWithRelations = Employee & {
  branch?: Pick<Branch, "branch_city">;
  user_role?: Pick<UserRole, "role_name">;
};

export type WorkingHourWithEmployee = WorkingHour & {
  employee?: Employee;
};

/** Cart item including product info (commonly used on POS screens) */
export interface CartItemWithProduct {
  cart_id: UUID;
  order_id: UUID | null;
  quantity: number;
  sub_total_amount: MoneyString | null;
  created_at: ISODateString | null;

  product: Pick<Product, "product_id" | "product_name" | "product_barcode" | "product_image">;
}

/** A sales order payload typically shown in history with line items and references */
export interface SaleWithRelations {
  sale: SalesHistory;
  branch?: Pick<Branch, "branch_id" | "branch_city" | "branch_phone" | "branch_email">;
  cashier?: Pick<Employee, "employee_id" | "employee_name">;
  customer?: Pick<Customer, "customer_id" | "customer_name" | "customer_phone" | "rewards_points"> | null;
  payment_method?: Pick<PaymentMethod, "payment_method_id" | "payment_method_name"> | null;
  items: CartItemWithProduct[];
}

/** A product row with stock by branch, for inventory tables */
export type ProductWithInventory = Product & {
  inventory: Inventory[];
  category?: Category;
};

export type SupplierWithProducts = Supplier & {
  product: Product[];
};

export type ProductWithVariants = Product & {
  variants: Product_Variant[];
};

export type ProductWithCategory = ProductWithVariants & {
  category?: Category;
};

export type ProductDetails = ProductWithVariants & {
  category?: Category;
  supplier?: Supplier;
  inventory: Inventory[];
};
