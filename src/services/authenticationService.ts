import http from "./httpService";
import { jwtDecode } from "jwt-decode";

const ApiEndPoint = `${process.env.NEXT_PUBLIC_BACKEND}/auth`;

// if user is authenticated, return user object
export function authenticate({
  username,
  password,
}: {
  username: string;
  password: string;
}) {
  return http.post(`${ApiEndPoint}/login`, { username, password });
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
  return http.post(`${ApiEndPoint}/register`, {
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
  return http.put(`${ApiEndPoint}/resetPassword`, {
    username,
    password,
    newPassword,
  });
}

export function decodeJWT(token: string) {
  return jwtDecode(token);
}
