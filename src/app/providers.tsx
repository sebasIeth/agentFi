"use client";

import { MiniKitProvider } from "@worldcoin/minikit-js/minikit-provider";
import { AuthProvider } from "@/lib/auth";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MiniKitProvider props={{ appId: "app_c8ae3df9a08e3f6713dd1cbbac52d89d" }}>
      <AuthProvider>{children}</AuthProvider>
    </MiniKitProvider>
  );
}
