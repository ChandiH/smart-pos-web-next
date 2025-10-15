import http from "./httpService";
import type {
  Employee,
  GenericPayload,
  Identifier,
  WorkingHourRecord,
} from "./types";

const EMPLOYEE_RESOURCE = "/employee";
const WORKING_HOUR_RESOURCE = `${EMPLOYEE_RESOURCE}/working-hour`;

export const getEmployees = () => http.get<Employee[]>(EMPLOYEE_RESOURCE);

export const getEmployee = (id: Identifier) =>
  http.get<Employee>(`${EMPLOYEE_RESOURCE}/${id}`);

export const getEmployeeByBranch = (branchId: Identifier) =>
  http.get<Employee[]>(`${EMPLOYEE_RESOURCE}/branch/${branchId}`);

export const getEmployeeByRole = (roleId: Identifier) =>
  http.get<Employee[]>(`${EMPLOYEE_RESOURCE}/role/${roleId}`);

export const updateEmployee = (id: Identifier, data: GenericPayload) =>
  http.put<Employee>(`${EMPLOYEE_RESOURCE}/${id}`, data);

export const updateEmployeeImage = (id: Identifier, file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  return http.put<Employee>(`${EMPLOYEE_RESOURCE}/image/${id}`, formData, {
    headers: { "content-type": "multipart/form-data" },
  });
};

export const getRecordByDate = (date: string) =>
  http.get<WorkingHourRecord[]>(`${WORKING_HOUR_RESOURCE}/date/${date}`);

export const getRecordByDateBranch = (
  date: string,
  branchId: Identifier
) =>
  http.get<WorkingHourRecord[]>(
    `${WORKING_HOUR_RESOURCE}/date-branch/${date}/${branchId}`
  );

export const addEmployeeRecord = (data: GenericPayload) =>
  http.post<WorkingHourRecord>(WORKING_HOUR_RESOURCE, data);
