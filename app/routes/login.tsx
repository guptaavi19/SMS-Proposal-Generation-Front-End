import { useEffect } from "react";
import { http } from "~/lib/utils";

const Page = () => {
  useEffect(() => {
    (async () => {
      const res = await http.get("/auth/login");
      location.href = res.data.authUrl;
    })();
  }, []);

  return null;
};

export default Page;
