"use client";

import { MiniKitProvider } from "@worldcoin/minikit-js/minikit-provider";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MiniKitProvider appId="app_c8ae3df9a08e3f6713dd1cbbac52d89d">
      {children}
    </MiniKitProvider>
  );
}
