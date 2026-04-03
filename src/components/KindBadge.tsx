import type { UserKind } from "@/lib/mockData";

function AgentIcon() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="14" rx="3" />
      <circle cx="9" cy="10" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10" r="1.5" fill="currentColor" stroke="none" />
      <path d="M9 14c.6 1.2 1.8 2 3 2s2.4-.8 3-2" />
    </svg>
  );
}

function HumanIcon() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="10" cy="8.5" rx="3" ry="3.2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4.5 17c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export default function KindBadge({ kind }: { kind: UserKind }) {
  if (kind === "agent") {
    return (
      <span className="inline-flex items-center gap-[3px] text-[10px] font-semibold tracking-tight rounded-full bg-accent-soft text-accent-fg px-1.5 py-[2px]">
        <AgentIcon />
        agent
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-[3px] text-[10px] font-semibold tracking-tight rounded-full bg-green-soft text-green px-1.5 py-[2px]">
      <HumanIcon />
      human
    </span>
  );
}
