"use client";

import { useState, useCallback } from "react";
import { IDKitRequestWidget, orbLegacy, type RpContext } from "@worldcoin/idkit";
import { useAuth } from "@/lib/auth";

const APP_ID = "app_c8ae3df9a08e3f6713dd1cbbac52d89d";
const RP_ID = "rp_4af75d3d6fa314d0";

export function useWorldIDVerify(action: string) {
  const { user } = useAuth();
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rpContext, setRpContext] = useState<RpContext | null>(null);
  const [open, setOpen] = useState(false);

  const startVerification = useCallback(async () => {
    setVerifying(true);
    setError(null);

    try {
      const res = await fetch("/api/worldid/sign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to start verification");
        setVerifying(false);
        return;
      }

      setRpContext({
        rp_id: RP_ID,
        nonce: data.nonce,
        created_at: data.created_at,
        expires_at: data.expires_at,
        signature: data.sig,
      });

      setOpen(true);
    } catch {
      setError("Failed to start verification");
      setVerifying(false);
    }
  }, [action]);

  const handleVerify = useCallback(
    async (result: unknown) => {
      try {
        const res = await fetch("/api/worldid/verify", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            rp_id: RP_ID,
            idkitResponse: result,
            walletAddress: user?.walletAddress,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Verification failed");
        }
      } catch (err) {
        throw err;
      }
    },
    [user?.walletAddress],
  );

  const handleSuccess = useCallback(() => {
    setVerified(true);
    setVerifying(false);
    setOpen(false);
  }, []);

  const Widget = rpContext ? (
    <IDKitRequestWidget
      open={open}
      onOpenChange={(o: boolean) => { setOpen(o); if (!o) setVerifying(false); }}
      app_id={APP_ID}
      action={action}
      rp_context={rpContext}
      allow_legacy_proofs={true}
      preset={orbLegacy({ signal: user?.walletAddress || "" })}
      handleVerify={handleVerify}
      onSuccess={handleSuccess}
    />
  ) : null;

  return {
    verified,
    verifying,
    error,
    startVerification,
    Widget,
  };
}

export default function WorldIDVerifyButton({
  action,
  onVerified,
  children,
}: {
  action: string;
  onVerified: () => void;
  children?: React.ReactNode;
}) {
  const { verified, verifying, error, startVerification, Widget } = useWorldIDVerify(action);

  if (verified) {
    onVerified();
    return null;
  }

  return (
    <>
      <button
        onClick={startVerification}
        disabled={verifying}
        className={`w-full text-[14px] font-bold rounded-xl py-3 transition-colors flex items-center justify-center gap-2 ${
          verifying ? "bg-fg/60 text-white" : "bg-fg text-white hover:bg-fg/90"
        }`}
      >
        {verifying ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Verifying...
          </>
        ) : (
          children || "Verify with World ID"
        )}
      </button>
      {error && <p className="text-[12px] text-red mt-2 text-center">{error}</p>}
      {Widget}
    </>
  );
}
