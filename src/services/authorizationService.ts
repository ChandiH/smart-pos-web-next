import { UserRole } from "@/types/prisma-types";
import http from "./httpService";
import type { AccessPermission, API_RESPONSE, GenericPayload, Identifier } from "./types";

const RESOURCE = "/user-role";

const staticAccessList: AccessPermission[] = [
  { access_scope: "cashier:view", access_name: "Cashier - View" },
  { access_scope: "cashier:all", access_name: "Cashier - All" },
  { access_scope: "report:view", access_name: "Reports - View" },
  { access_scope: "report:all", access_name: "Reports - All" },
  { access_scope: "inventory:view", access_name: "Inventory - View" },
  { access_scope: "inventory:manage", access_name: "Inventory - Manage" },
  { access_scope: "inventory:all", access_name: "Inventory - All" },
  { access_scope: "customers:view", access_name: "Customers - View" },
  { access_scope: "customers:manage", access_name: "Customers - Manage" },
  { access_scope: "customers:all", access_name: "Customers - All" },
  { access_scope: "suppliers:view", access_name: "Suppliers - View" },
  { access_scope: "suppliers:manage", access_name: "Suppliers - Manage" },
  { access_scope: "suppliers:all", access_name: "Suppliers - All" },
  { access_scope: "employee:view", access_name: "Employees - View" },
  { access_scope: "employee:manage", access_name: "Employees - Manage" },
  { access_scope: "employee:all", access_name: "Employees - All" },
  { access_scope: "roles:manage", access_name: "Roles - Manage" },
  { access_scope: "roles:all", access_name: "Roles - All" },
  { access_scope: "branch:view", access_name: "Branch - View" },
  { access_scope: "branch:manage", access_name: "Branch - Manage" },
  { access_scope: "branch:all", access_name: "Branch - All" },
  { access_scope: "configuration:manage", access_name: "Configuration - Manage" },
  { access_scope: "configuration:all", access_name: "Configuration - All" },
  { access_scope: "profile:view", access_name: "Profile - View" },
  { access_scope: "profile:all", access_name: "Profile - All" },
];

export const getUserRoles = async () => {
  const response = await http.get<API_RESPONSE<UserRole[]>>(RESOURCE);
  return response.data;
};

export const changeUserAccess = (roleId: Identifier, access: Identifier[]) => {
  return http.post(`${RESOURCE}/update`, { role_id: roleId, access });
};

export const accessList = (): AccessPermission[] => staticAccessList;

export const addNewUserRole = (data: GenericPayload) => http.post(RESOURCE, data);

export const deleteUserRole = (roleId: Identifier) => http.delete(`${RESOURCE}/${roleId}`);
