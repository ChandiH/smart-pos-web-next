import { jwtDecode } from "jwt-decode";

import http from "./httpService";

const RESOURCE = "/auth";

// if user is authenticated, return user object
export function authenticate({
  username,
  password,
}: {
  username: string;
  password: string;
}) {
  return http.post(`${RESOURCE}/login`, { username, password });
}

export function registerEmployee({
  employee_name,
  employee_userName,
  role_id,
  employee_email,
  employee_phone,
  branch_id,
  employee_image,
}: {
  employee_name: string;
  employee_userName: string;
  role_id: number;
  employee_email: string;
  employee_phone: string;
  branch_id: number;
  employee_image: string;
}) {
  return http.post(`${RESOURCE}/register`, {
    employee_name,
    employee_userName,
    employee_email,
    employee_phone,
    employee_image,
    branch_id,
    role_id,
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

export function decodeJWT(token: string) {
  return jwtDecode(token);
}
