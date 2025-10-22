import { EmployeeWithRelations, WorkingHourWithEmployee } from "@/types/prisma-types";
import http from "./httpService";
import type { GenericPayload, Identifier, WorkingHourRecord } from "./types";

const EMPLOYEE_RESOURCE = "/employee";
const WORKING_HOUR_RESOURCE = `${EMPLOYEE_RESOURCE}/working-hour`;

export const getEmployees = async () => {
  const response = await http.get<{ data: EmployeeWithRelations[] }>(EMPLOYEE_RESOURCE);
  return response.data;
};

export const getEmployee = async (id: Identifier) => {
  const response = await http.get<{ data: EmployeeWithRelations }>(`${EMPLOYEE_RESOURCE}/${id}`);
  return response.data;
};

export const getEmployeeByBranch = async (branchId: Identifier) => {
  const response = await http.get<{ data: EmployeeWithRelations[] }>(`${EMPLOYEE_RESOURCE}/branch/${branchId}`);
  return response.data;
};

export const getEmployeeByRole = async (roleId: Identifier) => {
  const response = await http.get<{ data: EmployeeWithRelations[] }>(`${EMPLOYEE_RESOURCE}/role/${roleId}`);
  return response.data;
};

export const updateEmployee = async (id: Identifier, data: GenericPayload) => {
  const response = await http.put<{ data: EmployeeWithRelations }>(`${EMPLOYEE_RESOURCE}/${id}`, data);
  return response.data;
};

export const updateEmployeeImage = async (id: Identifier, file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await http.put<{ data: EmployeeWithRelations }>(`${EMPLOYEE_RESOURCE}/image/${id}`, formData, {
    headers: { "content-type": "multipart/form-data" },
  });
  return response.data;
};

export const getRecordByDate = async (date: string) => {
  const response = await http.get<{ data: WorkingHourRecord[] }>(`${WORKING_HOUR_RESOURCE}/date/${date}`);
  return response.data;
};

export const getRecordByDateBranch = async (date: string, branchId: Identifier) => {
  const response = await http.get<{ data: WorkingHourWithEmployee[] }>(
    `${WORKING_HOUR_RESOURCE}/date-branch/${date}/${branchId}`
  );
  return response.data;
};

export const addEmployeeRecord = async (data: GenericPayload) => {
  const response = await http.post<{ data: WorkingHourWithEmployee }>(WORKING_HOUR_RESOURCE, data);
  return response.data;
};
