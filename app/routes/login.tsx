// app/routes/login.tsx
import { useEffect } from "react";

const Page = () => {
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:8000/auth/login", {
          credentials: "include",
        });
        const data = await res.json();
        window.location.href = data.auth_url; // Redirect to Azure login
      } catch (err) {
        console.error("Login failed", err);
      }
    })();
  }, []);

  return null;
};

export default Page;
