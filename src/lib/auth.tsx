"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { MiniKit } from "@worldcoin/minikit-js";

interface UserData {
  walletAddress: string;
  username?: string;
  profilePictureUrl?: string;
  isOrbVerified: boolean;
  isDocumentVerified: boolean;
  isConnected: boolean;
  deviceOS?: string;
  worldAppVersion?: number;
}

interface AuthContextType {
  user: UserData | null;
  isLoading: boolean;
  isMiniApp: boolean;
  signIn: () => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isMiniApp: false,
  signIn: async () => {},
  signOut: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMiniApp, setIsMiniApp] = useState(false);

  const buildUser = useCallback((): UserData | null => {
    const wallet = MiniKit.user?.walletAddress;
    if (!wallet) {
      // Try getting it from window.WorldApp directly
      const w = typeof window !== "undefined"
        ? (window as unknown as Record<string, unknown>).WorldApp as Record<string, unknown> | undefined
        : undefined;
      const rawWallet = w?.wallet_address as string | undefined;
      if (!rawWallet) return null;

      const vs = w?.verification_status as Record<string, boolean> | undefined;
      return {
        walletAddress: rawWallet,
        username: MiniKit.user?.username,
        profilePictureUrl: MiniKit.user?.profilePictureUrl,
        isOrbVerified: vs?.is_orb_verified ?? false,
        isDocumentVerified: vs?.is_document_verified ?? false,
        isConnected: true,
        deviceOS: MiniKit.deviceProperties?.deviceOS,
        worldAppVersion: MiniKit.deviceProperties?.worldAppVersion,
      };
    }

    return {
      walletAddress: wallet,
      username: MiniKit.user?.username,
      profilePictureUrl: MiniKit.user?.profilePictureUrl,
      isOrbVerified: MiniKit.user?.verificationStatus?.isOrbVerified ?? false,
      isDocumentVerified: MiniKit.user?.verificationStatus?.isDocumentVerified ?? false,
      isConnected: true,
      deviceOS: MiniKit.deviceProperties?.deviceOS,
      worldAppVersion: MiniKit.deviceProperties?.worldAppVersion,
    };
  }, []);

  useEffect(() => {
    const init = async () => {
      await new Promise((r) => setTimeout(r, 500));

      const installed = MiniKit.isInstalled();
      setIsMiniApp(installed);

      if (installed) {
        const u = buildUser();
        if (u) setUser(u);
      }

      setIsLoading(false);
    };

    init();
  }, [buildUser]);

  const signIn = useCallback(async () => {
    setIsLoading(true);
    try {
      if (MiniKit.isInstalled()) {
        const res = await fetch("/api/nonce");
        const { nonce } = await res.json();

        const result = await MiniKit.walletAuth({
          nonce,
          statement: "Sign in to agentfi",
          expirationTime: new Date(Date.now() + 1000 * 60 * 60),
        });

        if (result.executedWith !== "fallback") {
          const verifyRes = await fetch("/api/complete-siwe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ payload: result.data, nonce }),
          });
          const verification = await verifyRes.json();

          if (verification.isValid) {
            // After walletAuth, username and profilePictureUrl get populated
            await new Promise((r) => setTimeout(r, 300));
            const u = buildUser();
            if (u) {
              u.walletAddress = verification.address;
              setUser(u);
            }
          }
        }
      }
    } catch (e) {
      console.error("Sign in failed:", e);
    }
    setIsLoading(false);
  }, [buildUser]);

  const signOut = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isMiniApp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
