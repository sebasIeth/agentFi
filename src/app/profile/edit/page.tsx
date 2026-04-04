"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Topbar from "@/components/Topbar";
import MobileNav from "@/components/MobileNav";
import { useAuth } from "@/lib/auth";

function BackIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export default function EditProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [bio, setBio] = useState("Builder on World Chain. Exploring AI agents and social finance.");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const displayName = user?.username || user?.walletAddress?.slice(0, 10) + "..." || "—";
  const shortAddr = user?.walletAddress
    ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
    : "—";

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => router.push("/profile"), 800);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Topbar />
      <main className="flex-1 w-full max-w-[480px] mx-auto pb-24">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => router.back()} className="text-fg-secondary hover:text-fg transition-colors">
            <BackIcon />
          </button>
          <span className="text-[15px] font-extrabold tracking-tight">Edit profile</span>
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className={`text-[13px] font-bold transition-colors ${
              saved ? "text-green" : saving ? "text-fg-tertiary" : "text-accent"
            }`}
          >
            {saved ? <CheckIcon /> : saving ? "Saving..." : "Save"}
          </button>
        </div>

        {/* Avatar — from World, not editable */}
        <div className="flex justify-center py-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-border bg-bg-active">
              {user?.profilePictureUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-fg-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              )}
            </div>
            {/* Lock icon instead of camera */}
            <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-bg-active text-fg-tertiary flex items-center justify-center ring-2 ring-bg-elevated">
              <LockIcon />
            </div>
          </div>
        </div>
        <p className="text-[11px] text-fg-tertiary text-center mb-4">Photo synced from World App</p>

        {/* Form */}
        <div className="px-4 flex flex-col gap-5">
          {/* Display name — from World, locked */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <label className="text-[12px] font-semibold text-fg-tertiary">Display name</label>
              <LockIcon />
            </div>
            <div className="w-full bg-bg-active border border-border rounded-xl px-4 py-3 text-[14px] font-medium text-fg-tertiary">
              {displayName}
            </div>
            <span className="text-[11px] text-fg-tertiary mt-1 block">Synced from your World App profile</span>
          </div>

          {/* Wallet — locked */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <label className="text-[12px] font-semibold text-fg-tertiary">Wallet address</label>
              <LockIcon />
            </div>
            <div className="w-full bg-bg-active border border-border rounded-xl px-4 py-3 text-[14px] font-mono font-medium text-fg-tertiary">
              {shortAddr}
            </div>
            <span className="text-[11px] text-fg-tertiary mt-1 block">Linked to your World ID</span>
          </div>

          {/* Bio — editable */}
          <div>
            <label className="text-[12px] font-semibold text-fg-tertiary block mb-1.5">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={160}
              className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-3 text-[14px] font-medium resize-none focus:outline-none focus:border-fg focus:ring-1 focus:ring-fg transition-all"
            />
            <span className="text-[11px] text-fg-tertiary mt-1 block text-right">{bio.length}/160</span>
          </div>

          {/* Links — editable */}
          <div>
            <label className="text-[12px] font-semibold text-fg-tertiary block mb-1.5">Links</label>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 bg-bg-elevated border border-border rounded-xl px-4 py-3">
                <svg className="w-4 h-4 text-fg-tertiary shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <input
                  type="text"
                  placeholder="x.com/username"
                  className="flex-1 bg-transparent text-[13px] font-medium placeholder:text-fg-tertiary outline-none"
                />
              </div>
              <div className="flex items-center gap-3 bg-bg-elevated border border-border rounded-xl px-4 py-3">
                <svg className="w-4 h-4 text-fg-tertiary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                <input
                  type="text"
                  placeholder="yourwebsite.com"
                  className="flex-1 bg-transparent text-[13px] font-medium placeholder:text-fg-tertiary outline-none"
                />
              </div>
            </div>
          </div>

          {/* Verification status */}
          <div className={`rounded-2xl border p-4 ${
            user?.isOrbVerified
              ? "border-green/20 bg-green-soft"
              : "border-border bg-bg-elevated"
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                user?.isOrbVerified ? "bg-green/10" : "bg-bg-active"
              }`}>
                <svg className={`w-5 h-5 ${user?.isOrbVerified ? "text-green" : "text-fg-tertiary"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  {user?.isOrbVerified && <path d="M9 12l2 2 4-4" />}
                </svg>
              </div>
              <div>
                <div className={`text-[13px] font-bold ${user?.isOrbVerified ? "text-green" : "text-fg-secondary"}`}>
                  {user?.isOrbVerified ? "Orb verified" : "Not orb verified"}
                </div>
                <div className={`text-[11px] ${user?.isOrbVerified ? "text-green/70" : "text-fg-tertiary"}`}>
                  {user?.isOrbVerified
                    ? "Your identity is verified with World Orb"
                    : "Visit a World Orb to verify your identity"
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Danger zone */}
          <div className="pt-4 border-t border-border">
            <button className="text-[13px] font-semibold text-red">
              Delete account
            </button>
          </div>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
