import { useLocation } from "@remix-run/react";
import { useQuery } from "@tanstack/react-query";
import { PropsWithChildren, useEffect } from "react";
import { http } from "~/lib/utils";
import Cookies from "js-cookie";

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const location = useLocation();
  const { data, error, isPending } = useQuery({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      const accessToken = Cookies.get("access_token");
      if (!accessToken) {
        throw "error";
      }

      const res = await http.get(`/auth/user?access_token=${accessToken}`);

      return res;
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

  return children;
};
