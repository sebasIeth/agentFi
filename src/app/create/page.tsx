"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

function BackIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

export default function CreatePage() {
  const router = useRouter();
  const { user, isMiniApp, signIn } = useAuth();
  const [content, setContent] = useState("");
  const [tokenTag, setTokenTag] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Not connected — show sign in gate
  if (!user?.isConnected) {
    return (
      <div className="min-h-screen flex flex-col bg-bg">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <button onClick={() => router.back()} className="text-fg-secondary hover:text-fg transition-colors">
            <BackIcon />
          </button>
          <span className="text-[15px] font-extrabold tracking-tight">Create post</span>
          <div className="w-5" />
        </div>
        <main className="flex-1 flex flex-col items-center justify-center px-4 pb-24">
          <div className="w-16 h-16 rounded-full bg-bg-active flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-fg-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h2 className="text-[18px] font-extrabold mb-1">Sign in to post</h2>
          <p className="text-[13px] text-fg-tertiary text-center mb-5 max-w-[260px]">
            Connect your World wallet to create posts.
          </p>
          {isMiniApp ? (
            <button
              onClick={signIn}
              className="w-full max-w-[280px] text-[14px] font-bold text-white bg-accent hover:bg-accent/85 rounded-xl py-3 transition-colors"
            >
              Sign in with World ID
            </button>
          ) : (
            <p className="text-[12px] text-fg-tertiary">Open in World App to sign in</p>
          )}
        </main>
      </div>
    );
  }

  const displayName = user.username || `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`;

  const handlePost = async () => {
    if (!content.trim() || !tokenTag.trim() || posting) return;

    setPosting(true);
    setError(null);

    // Ensure tag has $ prefix when sent to the API
    const tag = tokenTag.startsWith("$") ? tokenTag : `$${tokenTag}`;

    try {
      const res = await fetch("/api/posts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentWallet: user.walletAddress,
          content: content.trim(),
          imageUrl: null,
          tag,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      router.push("/feed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPosting(false);
    }
  };

  const canPost = content.trim().length > 0 && tokenTag.trim().length > 0 && !posting;

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button onClick={() => router.back()} className="text-fg-secondary hover:text-fg transition-colors">
          <BackIcon />
        </button>
        <span className="text-[15px] font-extrabold tracking-tight">Create post</span>
        <button
          onClick={handlePost}
          disabled={!canPost}
          className={`text-[13px] font-bold text-white rounded-xl px-4 py-1.5 transition-colors ${
            canPost ? "bg-accent hover:bg-accent/85" : "bg-accent/40 cursor-not-allowed"
          }`}
        >
          {posting ? "Posting..." : "Post"}
        </button>
      </div>

      <main className="flex-1 w-full max-w-[480px] mx-auto px-4 py-5 flex flex-col gap-4">
        {/* Author row */}
        <div className="flex items-center gap-3">
          {user.profilePictureUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.profilePictureUrl} alt={displayName} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-bg-active flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-fg-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          )}
          <span className="text-[14px] font-bold">{displayName}</span>
        </div>

        {/* Text area */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          rows={5}
          className="w-full bg-transparent text-[15px] text-fg placeholder:text-fg-tertiary resize-none outline-none leading-relaxed"
        />

        {/* Token tag input */}
        <div className="rounded-xl border border-border bg-bg-elevated px-4 py-3 flex items-center gap-2">
          <span className="text-[13px] font-bold text-fg-tertiary">$</span>
          <input
            type="text"
            value={tokenTag.replace(/^\$/, "")}
            onChange={(e) => setTokenTag(e.target.value.replace(/^\$+/, "").toUpperCase())}
            placeholder="TOKEN tag (e.g. ALPHA)"
            className="flex-1 bg-transparent text-[13px] font-bold text-fg placeholder:text-fg-tertiary outline-none uppercase"
            maxLength={10}
          />
        </div>

        {/* Image upload placeholder */}
        <button
          disabled
          className="w-full rounded-xl border border-dashed border-border bg-bg-elevated py-8 flex flex-col items-center gap-2 text-fg-tertiary cursor-not-allowed"
        >
          <ImageIcon />
          <span className="text-[12px] font-medium">Add image (coming soon)</span>
        </button>

        {/* Error message */}
        {error && (
          <div className="rounded-xl border border-red/20 bg-red/5 px-4 py-3">
            <p className="text-[12px] text-red font-medium text-center">{error}</p>
          </div>
        )}
      </main>
    </div>
  );
}
