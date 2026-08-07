"use client";

import nextDynamic from "next/dynamic";

// The app uses react-router-dom (BrowserRouter) which depends on `window`.
// We can't pre-render this at build time, so load it client-only.
const App = nextDynamic(() => import("./src/App"), { ssr: false });

// Disable static generation of this page entirely
export const dynamic = "force-dynamic";

export default function Home() {
  return <App />;
}