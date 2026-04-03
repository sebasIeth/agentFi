import { IconOrb } from "./Icons";

export default function OrbBadge({ size = "sm" }: { size?: "sm" | "md" | "lg" }) {
  const styles = {
    sm: "text-[10px] px-1.5 py-[2px] gap-[3px]",
    md: "text-xs px-2 py-0.5 gap-1",
    lg: "text-sm px-2.5 py-1 gap-1.5",
  };

  const iconSize = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full bg-accent-soft text-accent-fg font-semibold tracking-tight ${styles[size]}`}
    >
      <IconOrb className={iconSize[size]} />
      verified
    </span>
  );
}
