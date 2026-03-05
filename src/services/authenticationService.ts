import { jwtDecode } from "jwt-decode";

import http from "./httpService";
import { UserCredentials } from "@/context/UserContext";

const RESOURCE = "/auth";

type AuthenticateResponse = {
  token: string;
};

// if user is authenticated, return user object
export function authenticate({
  username,
  password,
}: {
  username: string;
  password: string;
}) {
  return http.post<AuthenticateResponse>(`${RESOURCE}/login`, {
    username,
    password,
  });
}

type RegisterEmployeePayload = {
  employee_name: string;
  employee_userName: string;
  role_id: string;
  employee_email: string;
  employee_phone: string;
  branch_id: string;
  employee_image?: string;
};

export function registerEmployee(payload: RegisterEmployeePayload) {
  return http.post(`${RESOURCE}/register`, {
    employee_name: payload.employee_name,
    employee_userName: payload.employee_userName,
    employee_email: payload.employee_email,
    employee_phone: payload.employee_phone,
    employee_image: payload.employee_image ?? "",
    branch_id: payload.branch_id,
    role_id: payload.role_id,
  });
}

export function resetPassword(
  username: string,
  password: string,
  newPassword: string
) {
  return http.put(`${RESOURCE}/resetPassword`, {
    username,
    password,
    newPassword,
  });
}

export function decodeJWT(token: string): UserCredentials {
  return jwtDecode(token);
}
