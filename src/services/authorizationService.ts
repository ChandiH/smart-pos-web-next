import http from "./httpService";
import type { AccessPermission, GenericPayload, Identifier } from "./types";

const RESOURCE = "/user-role";

const staticAccessList: AccessPermission[] = [
  { access_type_id: 1, access_name: "configuration" },
  { access_type_id: 2, access_name: "report" },
  { access_type_id: 3, access_name: "employee" },
  { access_type_id: 4, access_name: "employeeDetails" },
  { access_type_id: 5, access_name: "addEmployee" },
  { access_type_id: 6, access_name: "inventory" },
  { access_type_id: 7, access_name: "productForm" },
  { access_type_id: 8, access_name: "stockUpdateForm" },
  { access_type_id: 9, access_name: "productCatalog" },
  { access_type_id: 10, access_name: "customerForm" },
  { access_type_id: 11, access_name: "customers" },
  { access_type_id: 12, access_name: "supplierForm" },
  { access_type_id: 13, access_name: "supplier" },
  { access_type_id: 14, access_name: "supplierDetails" },
  { access_type_id: 15, access_name: "addBranch" },
];

export const getUserRoles = () => http.get(RESOURCE);

export const changeUserAccess = (
  roleId: Identifier,
  access: Identifier[]
) => http.post(`${RESOURCE}/update`, { role_id: roleId, access });

export const accessList = (): AccessPermission[] => staticAccessList;

export const addNewUserRole = (data: GenericPayload) =>
  http.post(RESOURCE, data);

export const deleteUserRole = (roleId: Identifier) =>
  http.delete(`${RESOURCE}/${roleId}`);
