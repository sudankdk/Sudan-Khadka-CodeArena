import { getEloTierInfo, type EloTierName } from "@/types/battle/battle";

interface EloTierBadgeProps {
  rating: number;
  tier?: string;
  showRating?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const TIER_ICONS: Record<EloTierName, string> = {
  Beginner: "◇",
  Bronze: "◆",
  Silver: "★",
  Gold: "♛",
  Platinum: "⬡",
  Diamond: "◈",
  Master: "♚",
};

/**
 * Displays a user's ELO tier as a colored badge with icon.
 * Uses the same rating-to-tier mapping as the backend.
 */
export default function EloTierBadge({
  rating,
  tier,
  showRating = true,
  size = "md",
  className = "",
}: EloTierBadgeProps) {
  const tierInfo = getEloTierInfo(rating);
  const displayTier = (tier as EloTierName) || tierInfo.name;
  const color = tierInfo.color;
  const icon = TIER_ICONS[displayTier] || TIER_ICONS[tierInfo.name];

  const sizeClasses = {
    sm: "text-[10px] px-2 py-0.5",
    md: "text-xs px-3 py-1",
    lg: "text-sm px-4 py-1.5",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono tracking-widest border ${sizeClasses[size]} ${className}`}
      style={{ color, borderColor: color }}
    >
      <span>{icon}</span>
      <span>{displayTier.toUpperCase()}</span>
      {showRating && (
        <span className="opacity-70 ml-1">{Math.round(rating)}</span>
      )}
    </span>
  );
}
