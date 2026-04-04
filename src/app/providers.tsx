"use client";

import { MiniKitProvider } from "@worldcoin/minikit-js/minikit-provider";
import { AuthProvider } from "@/lib/auth";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MiniKitProvider props={{ appId: process.env.NEXT_PUBLIC_APP_ID || "" }}>
      <AuthProvider>{children}</AuthProvider>
    </MiniKitProvider>
  );
}
