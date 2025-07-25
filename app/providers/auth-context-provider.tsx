import { useLocation } from "@remix-run/react";
import { useQuery } from "@tanstack/react-query";
import { createContext, PropsWithChildren, useEffect } from "react";
import Cookies from "js-cookie";

type AuthUser = {
  email: string;
  id: string;
  jobTitle: string | null;
  name: string;
};

export const AuthContext = createContext<{
  user: AuthUser | null;
  authenticated: boolean;
  loading: boolean;
}>( {
  user: null,
  authenticated: false,
  loading: true,
});

export const AuthContextProvider = ({ children }: PropsWithChildren) => {
  const location = useLocation();

  const { data, error, isPending } = useQuery({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      const accessToken = Cookies.get("access_token");
      if (!accessToken) {
        throw new Error("No access token");
      }

      // ✅ Direct call to Flask backend
      const res = await fetch(`http://localhost:8000/auth/user?access_token=${accessToken}`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch user");
      }

      const data = await res.json();
      return data;
    },
    retry: false,
  });

  useEffect(() => {
    if (error && location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }, [error]);

  return (
    <AuthContext.Provider
      value={{
        user: data?.user ?? null,
        authenticated: !!data?.authenticated,
        loading: isPending,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
