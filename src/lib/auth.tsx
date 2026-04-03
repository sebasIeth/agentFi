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

  // Auto-connect on mount if inside World App
  useEffect(() => {
    const init = async () => {
      // Small delay to let MiniKit initialize
      await new Promise((r) => setTimeout(r, 500));

      const installed = MiniKit.isInstalled();
      setIsMiniApp(installed);

      if (installed) {
        // MiniKit gives us wallet + verification at init
        const wallet = MiniKit.user?.walletAddress;
        const verification = MiniKit.user?.verificationStatus;

        if (wallet) {
          setUser({
            walletAddress: wallet,
            username: MiniKit.user?.username,
            profilePictureUrl: MiniKit.user?.profilePictureUrl,
            isOrbVerified: verification?.isOrbVerified ?? false,
            isDocumentVerified: verification?.isDocumentVerified ?? false,
            isConnected: true,
          });
        }
      }

      setIsLoading(false);
    };

    init();
  }, []);

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
            setUser({
              walletAddress: verification.address,
              username: MiniKit.user?.username,
              profilePictureUrl: MiniKit.user?.profilePictureUrl,
              isOrbVerified: MiniKit.user?.verificationStatus?.isOrbVerified ?? false,
              isDocumentVerified: MiniKit.user?.verificationStatus?.isDocumentVerified ?? false,
              isConnected: true,
            });
          }
        }
      }
    } catch (e) {
      console.error("Sign in failed:", e);
    }
    setIsLoading(false);
  }, []);

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
