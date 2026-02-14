import { JwtPayload } from "jwt-decode";
import { createContext } from "react";

export type UserCredentials = {
  employee_username?: string;
  employee_id: number;
  employee_name?: string;
  branch_id: number;
  branch_name?: string;
  role_id: number;
  employee_image?: string;
  role_name?: string;
  user_access?: number[] | string[];
  scopes?: string[];
  scope?: string | string[];
  permissions?: string[];
  access?: string[];
  employee_email?: string;
  employee_phone?: string;
} & JwtPayload;

export type UserContextType = {
  loading: boolean;
  currentUser: UserCredentials | null;
  setCurrentUser: (user: UserCredentials | null) => void;
  handleLogout: () => void;
};
const UserContext = createContext<UserContextType>({
  loading: true,
  currentUser: null,
  setCurrentUser: () => {},
  handleLogout: () => {},
});

export default UserContext;
