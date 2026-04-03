"use client";

import { useState } from "react";
import { MiniKit } from "@worldcoin/minikit-js";
import Topbar from "@/components/Topbar";
import MobileNav from "@/components/MobileNav";
import { useAuth } from "@/lib/auth";

export default function DebugPage() {
  const { user, isLoading, isMiniApp, signIn } = useAuth();
  const [rawData, setRawData] = useState<string>("");

  const loadRawData = () => {
    const data = {
      isInstalled: MiniKit.isInstalled(),
      user: MiniKit.user,
      deviceProperties: MiniKit.deviceProperties,
      location: MiniKit.location,
      windowWorldApp: typeof window !== "undefined" ? (window as unknown as Record<string, unknown>).WorldApp : "N/A",
    };
    setRawData(JSON.stringify(data, null, 2));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Topbar />
      <main className="flex-1 w-full max-w-[480px] mx-auto px-4 py-4 pb-24">
        <h1 className="text-xl font-extrabold mb-4">Debug</h1>

        {/* Connection status */}
        <div className="rounded-2xl bg-bg-elevated border border-border p-4 mb-4">
          <h2 className="text-[13px] font-bold mb-3">Connection status</h2>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-fg-secondary">MiniKit installed</span>
              <span className={`text-[13px] font-bold ${isMiniApp ? "text-green" : "text-red"}`}>
                {isMiniApp ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-fg-secondary">Auth loading</span>
              <span className="text-[13px] font-bold">{isLoading ? "Yes" : "No"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-fg-secondary">Connected</span>
              <span className={`text-[13px] font-bold ${user?.isConnected ? "text-green" : "text-fg-tertiary"}`}>
                {user?.isConnected ? "Yes" : "No"}
              </span>
            </div>
          </div>
        </div>

        {/* User data */}
        <div className="rounded-2xl bg-bg-elevated border border-border p-4 mb-4">
          <h2 className="text-[13px] font-bold mb-3">User data</h2>
          {user ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-fg-secondary">Wallet</span>
                <span className="text-[12px] font-mono font-bold text-fg truncate max-w-[200px]">{user.walletAddress}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-fg-secondary">Username</span>
                <span className="text-[13px] font-bold">{user.username || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-fg-secondary">Profile picture</span>
                <span className="text-[13px] font-bold">{user.profilePictureUrl ? "Yes" : "—"}</span>
              </div>
              {user.profilePictureUrl && (
                <div className="flex justify-end">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={user.profilePictureUrl} alt="" className="w-12 h-12 rounded-full" />
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-fg-secondary">Orb verified</span>
                <span className={`text-[13px] font-bold ${user.isOrbVerified ? "text-green" : "text-fg-tertiary"}`}>
                  {user.isOrbVerified ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-fg-secondary">Doc verified</span>
                <span className={`text-[13px] font-bold ${user.isDocumentVerified ? "text-green" : "text-fg-tertiary"}`}>
                  {user.isDocumentVerified ? "Yes" : "No"}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-[13px] text-fg-tertiary">No user data yet</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 mb-4">
          {!user?.isConnected && (
            <button
              onClick={signIn}
              className="w-full text-[14px] font-bold text-white bg-accent rounded-xl py-3 transition-colors hover:bg-accent/85"
            >
              Sign in with World ID
            </button>
          )}
          <button
            onClick={loadRawData}
            className="w-full text-[14px] font-bold text-fg border border-border rounded-xl py-3 transition-colors hover:bg-bg-hover"
          >
            Load raw MiniKit data
          </button>
        </div>

        {/* Raw data */}
        {rawData && (
          <div className="rounded-2xl bg-fg text-bg-elevated p-4 overflow-x-auto">
            <h2 className="text-[13px] font-bold mb-2 text-bg-elevated/60">Raw data</h2>
            <pre className="text-[11px] font-mono whitespace-pre-wrap break-all">{rawData}</pre>
          </div>
        )}
      </main>
      <MobileNav />
    </div>
  );
}
