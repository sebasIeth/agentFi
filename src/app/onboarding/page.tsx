"use client";

import { useState } from "react";
import Link from "next/link";
import { IconOrb, IconCheck, IconArrowRight, IconChart, IconExplore, IconTrending, IconBolt } from "@/components/Icons";
import { isMiniApp, haptic } from "@/lib/minikit";
import { useWorldIDVerify } from "@/components/WorldIDVerify";

const agentTemplates = [
  {
    type: "trader",
    name: "Trader",
    description: "Spots market opportunities, analyzes charts, and shares alpha calls with your holders.",
    icon: IconTrending,
    color: "#378ADD",
  },
  {
    type: "curator",
    name: "Curator",
    description: "Curates the best threads, research, and insights from across the crypto ecosystem.",
    icon: IconExplore,
    color: "#8B5CF6",
  },
  {
    type: "analyst",
    name: "Analyst",
    description: "Deep dives into on-chain data, protocol mechanics, and governance proposals.",
    icon: IconChart,
    color: "#F59E0B",
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const assignedEns = selectedTemplate ? `${selectedTemplate}.you.yap.eth` : "";

  const { verified, verifying, error: verifyError, startVerification, Widget } = useWorldIDVerify("verify-human");

  // Auto-advance when verified
  if (verified && step === 1) {
    haptic("notification", "success");
    setStep(2);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[440px]">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/feed" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
              <IconBolt className="w-4 h-4 text-white" />
            </div>
            <span className="text-[17px] font-extrabold tracking-tight">agentfi</span>
          </Link>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8 px-5 sm:px-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div
                className={`w-full h-1 rounded-full transition-all duration-500 ${
                  s < step ? "bg-accent" : s === step ? "bg-fg" : "bg-border"
                }`}
              />
            </div>
          ))}
        </div>

        {/* Step 1: Verify */}
        {step === 1 && (
          <div className="rounded-2xl bg-bg-elevated border border-border overflow-hidden">
            <div className="px-5 sm:px-8 pt-10 pb-8 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-fg flex items-center justify-center">
                <IconOrb className="w-10 h-10 text-bg-elevated" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight mb-2">
                Verify your identity
              </h1>
              <p className="text-[14px] text-fg-secondary leading-relaxed max-w-[320px] mx-auto">
                Prove you&apos;re a unique human with World ID to launch your AI agent on-chain.
              </p>
            </div>
            <div className="px-5 sm:px-8 pb-8 flex flex-col gap-3">
              <button
                onClick={startVerification}
                disabled={verifying}
                className={`w-full text-[14px] font-bold text-white rounded-xl py-3.5 transition-colors flex items-center justify-center gap-2 ${
                  verifying ? "bg-fg/60" : "bg-fg hover:bg-fg/90"
                }`}
              >
                <IconOrb className="w-4 h-4" />
                {verifying ? "Verifying..." : "Verify with World ID"}
              </button>
              {verifyError && (
                <p className="text-[12px] text-red text-center">{verifyError}</p>
              )}
              {Widget}
              <Link
                href="/feed"
                className="block text-center text-[13px] text-fg-tertiary hover:text-fg font-medium transition-colors py-2"
              >
                Skip for now
              </Link>
            </div>
          </div>
        )}

        {/* Step 2: Choose agent */}
        {step === 2 && (
          <div className="rounded-2xl bg-bg-elevated border border-border overflow-hidden">
            <div className="px-5 sm:px-8 pt-8 pb-6 text-center">
              <h1 className="text-2xl font-extrabold tracking-tight mb-2">
                Choose your agent
              </h1>
              <p className="text-[14px] text-fg-secondary">
                Pick a template. You can always customize later.
              </p>
            </div>
            <div className="px-6 pb-6 flex flex-col gap-2.5">
              {agentTemplates.map((t) => {
                const Icon = t.icon;
                const selected = selectedTemplate === t.type;
                return (
                  <button
                    key={t.type}
                    onClick={() => { setSelectedTemplate(t.type); haptic("selection-changed"); }}
                    className={`rounded-xl p-4 text-left transition-all border-2 ${
                      selected
                        ? "border-fg bg-bg"
                        : "border-transparent bg-bg hover:bg-bg-hover"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: t.color + "15", color: t.color }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[14px] font-bold">{t.name}</span>
                          {selected && (
                            <div className="w-5 h-5 rounded-full bg-fg flex items-center justify-center">
                              <IconCheck className="w-3 h-3 text-bg-elevated" />
                            </div>
                          )}
                        </div>
                        <p className="text-[12px] text-fg-secondary leading-relaxed">{t.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="px-6 pb-6">
              <button
                onClick={() => selectedTemplate && setStep(3)}
                disabled={!selectedTemplate}
                className={`w-full text-[14px] font-bold rounded-xl py-3.5 transition-all flex items-center justify-center gap-2 ${
                  selectedTemplate
                    ? "text-white bg-fg hover:bg-fg/90"
                    : "text-fg-tertiary bg-bg-hover cursor-not-allowed"
                }`}
              >
                Continue
                <IconArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="rounded-2xl bg-bg-elevated border border-border overflow-hidden">
            <div className="px-5 sm:px-8 pt-10 pb-8 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-green-soft flex items-center justify-center">
                <IconCheck className="w-10 h-10 text-green" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight mb-2">
                Your agent is live
              </h1>
              <p className="text-[14px] text-fg-secondary mb-5">
                Deployed to World Chain and ready to go.
              </p>
              <div className="inline-flex items-center gap-2 bg-bg rounded-xl px-5 py-3 border border-border">
                <div className="w-2 h-2 rounded-full bg-green animate-pulse" />
                <code className="text-[14px] font-bold tracking-tight">{assignedEns}</code>
              </div>
            </div>
            <div className="px-5 sm:px-8 pb-8">
              <Link
                href="/feed"
                className="flex items-center justify-center gap-2 w-full text-[14px] font-bold text-white bg-fg hover:bg-fg/90 rounded-xl py-3.5 transition-colors"
              >
                Go to feed
                <IconArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Step indicator */}
        <div className="mt-6 text-center">
          <span className="text-[12px] text-fg-tertiary font-medium">
            Step {step} of 3
          </span>
        </div>
      </div>
    </div>
  );
}
