import { useContext } from "react";
import { AuthContext } from "~/providers/auth-context-provider";

export const useAuth = () => {
  return useContext(AuthContext);
};
