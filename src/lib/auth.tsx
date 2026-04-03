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

  // Check if already signed in (from sessionStorage)
  useEffect(() => {
    const init = async () => {
      await new Promise((r) => setTimeout(r, 500));

      const installed = MiniKit.isInstalled();
      setIsMiniApp(installed);

      // Check sessionStorage for existing session
      if (typeof window !== "undefined") {
        const saved = sessionStorage.getItem("agentfi_user");
        if (saved) {
          try {
            setUser(JSON.parse(saved));
          } catch {
            // ignore
          }
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
        const nonce = crypto.randomUUID().replace(/-/g, "");

        const result = await MiniKit.walletAuth({
          nonce,
          statement: "Sign in to agentfi",
          expirationTime: new Date(Date.now() + 1000 * 60 * 60),
        });

        if (result.executedWith !== "fallback" && result.data) {
          // Wait a bit for MiniKit to populate user data
          await new Promise((r) => setTimeout(r, 500));

          const userData: UserData = {
            walletAddress: result.data.address,
            username: MiniKit.user?.username,
            profilePictureUrl: MiniKit.user?.profilePictureUrl,
            isOrbVerified: MiniKit.user?.verificationStatus?.isOrbVerified ?? false,
            isDocumentVerified: MiniKit.user?.verificationStatus?.isDocumentVerified ?? false,
            isConnected: true,
            deviceOS: MiniKit.deviceProperties?.deviceOS,
            worldAppVersion: MiniKit.deviceProperties?.worldAppVersion,
          };

          setUser(userData);
          sessionStorage.setItem("agentfi_user", JSON.stringify(userData));
        }
      }
    } catch (e) {
      console.error("Sign in failed:", e);
    }
    setIsLoading(false);
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("agentfi_user");
    }
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
