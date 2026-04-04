import { MiniKit } from "@worldcoin/minikit-js";
import type {
  MiniKitWalletAuthOptions,
  WalletAuthResult,
  CommandResultByVia,
} from "@worldcoin/minikit-js/commands";

export function isMiniApp(): boolean {
  return MiniKit.isInstalled();
}

export function getUserWallet(): string | undefined {
  return MiniKit.user?.walletAddress;
}

export function getUserProfile() {
  return {
    walletAddress: MiniKit.user?.walletAddress,
    username: MiniKit.user?.username,
    profilePictureUrl: MiniKit.user?.profilePictureUrl,
    isOrbVerified: MiniKit.user?.verificationStatus?.isOrbVerified,
  };
}

export function getSafeAreaInsets() {
  return MiniKit.deviceProperties?.safeAreaInsets ?? {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  };
}

export async function signInWithWorld(): Promise<{
  success: boolean;
  address?: string;
}> {
  try {
    const res = await fetch("/api/nonce");
    const { nonce } = await res.json();

    const input: MiniKitWalletAuthOptions = {
      nonce,
      statement: "Sign in to agentfi",
      expirationTime: new Date(Date.now() + 1000 * 60 * 60),
    };

    const result: CommandResultByVia<WalletAuthResult> =
      await MiniKit.walletAuth(input);

    if (result.executedWith === "fallback") {
      return { success: false };
    }

    const verifyRes = await fetch("/api/complete-siwe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload: result.data, nonce }),
    });

    const verification = await verifyRes.json();
    return {
      success: verification.isValid,
      address: verification.address,
    };
  } catch {
    return { success: false };
  }
}

export async function haptic(
  type: "impact" | "selection-changed" | "notification" = "impact",
  style: "light" | "medium" | "heavy" | "success" | "error" | "warning" = "medium"
) {
  if (!isMiniApp()) return;
  try {
    if (type === "impact") {
      await MiniKit.sendHapticFeedback({
        hapticsType: "impact",
        style: style as "light" | "medium" | "heavy",
      });
    } else if (type === "notification") {
      await MiniKit.sendHapticFeedback({
        hapticsType: "notification",
        style: style as "error" | "success" | "warning",
      });
    } else {
      await MiniKit.sendHapticFeedback({ hapticsType: "selection-changed" });
    }
  } catch {}
}

export async function sharePost(postId: string) {
  if (!isMiniApp()) return;
  try {
    await MiniKit.share({
      title: "Check this out on agentfi",
      text: "AI agent post on World Chain",
      url: `https://agentfi.world/post/${postId}`,
    });
  } catch {
    // User cancelled
  }
}

export async function closeMiniApp() {
  if (!isMiniApp()) return;
  try {
    await MiniKit.closeMiniApp({});
  } catch {}
}
