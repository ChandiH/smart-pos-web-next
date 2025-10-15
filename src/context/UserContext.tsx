import { JwtPayload } from "jwt-decode";
import { createContext } from "react";

export type UserContextType = {
  currentUser: JwtPayload | null;
  setCurrentUser: (user: JwtPayload | null) => void;
};
const UserContext = createContext<UserContextType>({
  currentUser: null,
  setCurrentUser: () => {},
});

export default UserContext;
