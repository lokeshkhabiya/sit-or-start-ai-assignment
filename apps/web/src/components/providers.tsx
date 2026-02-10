"use client";

import { Toaster } from "./ui/sonner";
import { AuthInitializer } from "./auth-initializer";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthInitializer />
      {children}
      <Toaster richColors />
    </>
  );
}
