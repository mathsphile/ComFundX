"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Users, Clock, Bookmark, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { useWalletStore } from "@/lib/store/walletStore";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { cn, formatXlm, daysUntil } from "@/lib/utils";

interface CampaignCardProps {
  campaign: {
    id: string;
    slug: string;
    title: string;
    shortDescription: string;
    category: string;
    fundingGoal: number;
    raisedAmount: number;
    deadline: string | Date;
    coverImage: string;
    featured?: boolean;
    verified?: boolean;
    creator?: { name?: string | null; avatar?: string | null };
    _count?: { donations?: number };
  };
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const { isConnected } = useWalletStore();

  const progressPercent = Math.min(100, Math.round((campaign.raisedAmount / campaign.fundingGoal) * 100));
  const diffDays = daysUntil(campaign.deadline);
  const backers = campaign._count?.donations ?? Math.floor(campaign.raisedAmount / 150);

  const toggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isConnected) {
      toast.error("Please connect wallet to bookmark campaigns");
      return;
    }

    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: campaign.id }),
      });
      const data = await res.json();
      setIsBookmarked(data.bookmarked);
      toast.success(data.bookmarked ? "Saved to Bookmarks" : "Removed from Bookmarks");
    } catch {
      toast.error("Failed to update bookmark");
    }
  };

  return (
    <Link
      href={`/campaigns/${campaign.slug}`}
      className="group panel panel-hover overflow-hidden flex flex-col h-full relative"
    >
      {/* Cover */}
      <div className="relative w-full h-48 overflow-hidden bg-surface-2">
        <Image
          src={campaign.coverImage}
          alt={campaign.title}
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg/80 via-bg/10 to-transparent" />

        {/* Category + featured */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <Badge tone="outline" className="bg-bg/70 backdrop-blur-sm text-fg border-line-strong">
            {campaign.category}
          </Badge>
          {campaign.featured && (
            <Badge tone="accent" className="bg-accent text-fg-on-accent border-transparent">
              Featured
            </Badge>
          )}
        </div>

        {/* Bookmark */}
        <button
          onClick={toggleBookmark}
          aria-label={isBookmarked ? "Remove bookmark" : "Bookmark campaign"}
          className={cn(
            "absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition-all",
            isBookmarked ? "bg-accent text-fg-on-accent" : "bg-bg/60 text-fg hover:bg-bg/85"
          )}
        >
          <Bookmark className={cn("w-4 h-4", isBookmarked && "fill-current")} />
        </button>
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col gap-4">
        {/* Creator */}
        {campaign.creator && (
          <div className="flex items-center gap-2">
            <Avatar src={campaign.creator.avatar} name={campaign.creator.name} size={22} />
            <span className="flex items-center gap-1 text-[12px] text-fg-muted">
              {campaign.creator.name || "Stellar Creator"}
              {campaign.verified && <BadgeCheck className="w-3.5 h-3.5 text-network" />}
            </span>
          </div>
        )}

        <div className="space-y-1.5">
          <h3 className="font-display text-[16px] font-semibold leading-snug text-fg transition-colors group-hover:text-accent-strong line-clamp-2">
            {campaign.title}
          </h3>
          <p className="text-[13px] text-fg-muted leading-relaxed line-clamp-2">{campaign.shortDescription}</p>
        </div>

        {/* Funding */}
        <div className="mt-auto space-y-2.5 pt-3 border-t border-line">
          <div className="flex items-center justify-between">
            <span className="font-display text-[15px] font-semibold text-fg tabular">
              {formatXlm(campaign.raisedAmount)} <span className="text-[11px] text-accent font-medium">XLM</span>
            </span>
            <span className="text-[11px] font-semibold text-network tabular">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} size="sm" />
          <div className="flex items-center justify-between text-[11px] text-fg-faint">
            <span>Goal {formatXlm(campaign.fundingGoal)} XLM</span>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between pt-2 text-[12px] text-fg-muted border-t border-line">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-fg-faint" />
            <span className="tabular">{backers} backers</span>
          </span>
          <span className={cn("flex items-center gap-1.5 font-medium", diffDays > 0 ? "text-warning" : "text-fg-faint")}>
            <Clock className="w-3.5 h-3.5" />
            {diffDays > 0 ? `${diffDays} days left` : "Ended"}
          </span>
        </div>
      </div>
    </Link>
  );
}
