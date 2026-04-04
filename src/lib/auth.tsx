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

async function doWalletAuth(): Promise<UserData | null> {
  try {
    const nonce = crypto.randomUUID().replace(/-/g, "");
    const result = await MiniKit.walletAuth({
      nonce,
      statement: "Sign in to agentfi",
      expirationTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
    });

    if (result.executedWith === "fallback" || !result.data) return null;

    const address = result.data.address.toLowerCase();
    let username: string | undefined;
    let profilePictureUrl: string | undefined;

    try {
      const profile = await MiniKit.getUserByAddress(address);
      username = profile?.username;
      profilePictureUrl = profile?.profilePictureUrl;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
      username = MiniKit.user?.username;
      profilePictureUrl = MiniKit.user?.profilePictureUrl;
    }

    return {
      walletAddress: address,
      username,
      profilePictureUrl,
      isOrbVerified: MiniKit.user?.verificationStatus?.isOrbVerified ?? false,
      isDocumentVerified: MiniKit.user?.verificationStatus?.isDocumentVerified ?? false,
      isConnected: true,
      deviceOS: MiniKit.deviceProperties?.deviceOS,
      worldAppVersion: MiniKit.deviceProperties?.worldAppVersion,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMiniApp, setIsMiniApp] = useState(false);

  useEffect(() => {
    const init = async () => {
      await new Promise((r) => setTimeout(r, 500));

      const installed = MiniKit.isInstalled();
      setIsMiniApp(installed);

      // Clear old sessions — force re-auth with lowercase wallet
      if (typeof window !== "undefined") {
        const version = sessionStorage.getItem("agentfi_v");
        if (version !== "2") {
          sessionStorage.removeItem("agentfi_user");
          sessionStorage.setItem("agentfi_v", "2");
        }

        const saved = sessionStorage.getItem("agentfi_user");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed?.isConnected && parsed.walletAddress) {
              parsed.walletAddress = parsed.walletAddress.toLowerCase();
              setUser(parsed);
              setIsLoading(false);
              return;
            }
          } catch { /* ignore */ }
        }
      }

      // Auto-connect if inside World App
      if (installed) {
        const userData = await doWalletAuth();
        if (userData) {
          setUser(userData);
          sessionStorage.setItem("agentfi_user", JSON.stringify(userData));
        }
      }

      setIsLoading(false);
    };

    init();
  }, []);

  const signIn = useCallback(async () => {
    setIsLoading(true);
    if (MiniKit.isInstalled()) {
      const userData = await doWalletAuth();
      if (userData) {
        setUser(userData);
        sessionStorage.setItem("agentfi_user", JSON.stringify(userData));
      }
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
