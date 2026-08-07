"use client";

import nextDynamic from "next/dynamic";

// Catch-all: every non-root path (/products, /products/:id, /checkout,
// /account, …) serves the same client shell so react-router (BrowserRouter)
// can handle the route on a direct load or refresh. Root "/" is served by
// ../page.tsx. Still pure client-side — no SSR of the SPA.
const App = nextDynamic(() => import("../src/App"), { ssr: false });

// Never statically generate these paths.
export const dynamic = "force-dynamic";

export default function CatchAll() {
  return <App />;
}
