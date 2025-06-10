import { hydrateRoot } from "react-dom/client";
import { RemixBrowser } from "@remix-run/react";
import { StrictMode } from "react";
import { startTransition } from "react";

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <RemixBrowser />
    </StrictMode>
  );
});
