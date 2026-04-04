"use client";

import { useAuth } from "./auth";

export function useRequireAuth() {
  const { user, signIn, isMiniApp } = useAuth();

  // Returns true if authenticated, triggers sign-in if not
  const requireAuth = async (): Promise<boolean> => {
    if (user?.isConnected) return true;

    if (isMiniApp) {
      await signIn();
      return true;
    }

    // Not in World App — can't sign in
    return false;
  };

  return { user, requireAuth, isConnected: !!user?.isConnected };
}
