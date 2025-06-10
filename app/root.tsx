import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useNavigation,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";
import nprogress from "nprogress";
import "./tailwind.css";
import "./style.css";
import "nprogress/nprogress.css";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { Toaster } from "./components/ui/sonner";
import { useEffect } from "react";
import { http } from "./lib/utils";
import axios from "axios";
import { AuthProvider } from "./providers/auth-provider";
import { Button } from "./components/ui/button";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

const queryClient = new QueryClient();

nprogress.configure({
  showSpinner: false,
  speed: 400,
  minimum: 0.2,
});

export function Layout({ children }: { children: React.ReactNode }) {
  const navigation = useNavigation();

  useEffect(() => {
    if (navigation.state === "loading") {
      nprogress.start();
    } else {
      nprogress.done();
    }
  }, [navigation.state]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>{children}</AuthProvider>
        </QueryClientProvider>
        <Toaster richColors theme="light" position="top-center" />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
