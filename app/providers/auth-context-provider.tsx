import { useLocation } from "@remix-run/react";
import { useQuery } from "@tanstack/react-query";
import { createContext, PropsWithChildren, useEffect, useState } from "react";
import { http } from "~/lib/utils";
import Cookies from "js-cookie";

export const AuthContext = createContext<{
  email: string;
}>({
  email: "",
});

export const AuthContextProvider = ({ children }: PropsWithChildren) => {
  const [email, setEmail] = useState<string>("");
  const location = useLocation();
  const { data, error, isPending } = useQuery({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      const accessToken = Cookies.get("access_token");
      if (!accessToken) {
        throw "error";
      }

      const res = await http.get<{
        authenticated: boolean;
        user: {
          email: string;
          id: string;
          jobTitle: string | null;
          name: string;
        };
      }>(`/auth/user?access_token=${accessToken}`);

      setEmail(res.data.user.email);

      return res.data;
    },
    retry: false,
  });

  useEffect(() => {
    if (error) {
      if (location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
  }, [error]);

  return (
    <AuthContext.Provider value={{ email }}>{children}</AuthContext.Provider>
  );
};
