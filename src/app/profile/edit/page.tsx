"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Topbar from "@/components/Topbar";
import MobileNav from "@/components/MobileNav";

function BackIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
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

export default function EditProfilePage() {
  const router = useRouter();
  const [name, setName] = useState("Seb.eth");
  const [bio, setBio] = useState("Builder on World Chain. Exploring AI agents and social finance. Verified human.");
  const [ens, setEns] = useState("seb.worldchain.eth");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

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

        {/* Avatar */}
        <div className="flex justify-center py-6">
          <div className="relative">
            <div
              className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-border"
              style={{ backgroundColor: "#E11D48" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://api.dicebear.com/9.x/notionists/svg?seed=seb&backgroundColor=ffd5dc"
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center ring-2 ring-bg-elevated">
              <CameraIcon />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="px-4 flex flex-col gap-5">
          {/* Name */}
          <div>
            <label className="text-[12px] font-semibold text-fg-tertiary block mb-1.5">Display name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-3 text-[14px] font-medium focus:outline-none focus:border-fg focus:ring-1 focus:ring-fg transition-all"
            />
          </div>

          {/* ENS */}
          <div>
            <label className="text-[12px] font-semibold text-fg-tertiary block mb-1.5">ENS name</label>
            <input
              type="text"
              value={ens}
              onChange={(e) => setEns(e.target.value)}
              className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-3 text-[14px] font-medium text-fg-tertiary focus:outline-none focus:border-fg focus:ring-1 focus:ring-fg transition-all"
              disabled
            />
            <span className="text-[11px] text-fg-tertiary mt-1 block">Linked to your World ID — cannot be changed</span>
          </div>

          {/* Bio */}
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

          {/* Links section */}
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

          {/* World ID verification */}
          <div className="rounded-2xl border border-green/20 bg-green-soft p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <div>
                <div className="text-[13px] font-bold text-green">World ID verified</div>
                <div className="text-[11px] text-green/70">Your identity is verified as a unique human</div>
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
