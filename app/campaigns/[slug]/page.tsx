"use client";

import { use, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Users,
  Clock,
  ShieldCheck,
  Share2,
  Bookmark,
  Globe,
  Github,
  BadgeCheck,
  Heart,
  Send,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { DonateModal } from "@/components/donate-modal";
import { useWalletStore } from "@/lib/store/walletStore";
import { Tabs } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Container } from "@/components/ui/container";
import { cn, formatXlm, daysUntil } from "@/lib/utils";

type TabKey = "story" | "milestones" | "updates" | "comments" | "rewards";

export default function CampaignDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [activeTab, setActiveTab] = useState<TabKey>("story");
  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const { isConnected } = useWalletStore();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["campaign-detail", slug],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns/${slug}`);
      if (!res.ok) throw new Error("Campaign not found");
      return res.json();
    },
  });

  const campaign = data?.campaign;

  if (isLoading) {
    return (
      <Container className="py-12 space-y-8 max-w-6xl">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-12 w-3/4" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-4">
            <Skeleton className="h-[380px] w-full rounded-card" />
            <Skeleton className="h-20 w-full" />
          </div>
          <div className="lg:col-span-5">
            <Skeleton className="h-[420px] w-full rounded-card" />
          </div>
        </div>
      </Container>
    );
  }

  if (!campaign) {
    return (
      <Container className="py-24 max-w-lg">
        <EmptyState
          title="Campaign not found"
          description="The campaign you're looking for doesn't exist or has been removed."
          action={
            <Button href="/campaigns" variant="secondary" icon={<ArrowLeft className="w-4 h-4" />}>
              Back to Marketplace
            </Button>
          }
        />
      </Container>
    );
  }

  const progressPercent = Math.min(100, Math.round((campaign.raisedAmount / campaign.fundingGoal) * 100));
  const diffDays = daysUntil(campaign.deadline);
  const backers = campaign._count?.donations ?? Math.floor(campaign.raisedAmount / 150);
  const galleryImages: string[] = campaign.gallery ? JSON.parse(campaign.gallery) : [];

  const videoEmbed = campaign.videoUrl
    ? campaign.videoUrl.includes("youtu.be")
      ? `https://www.youtube-nocookie.com/embed/${campaign.videoUrl.split("youtu.be/")[1]?.split("?")[0]}`
      : campaign.videoUrl.includes("v=")
        ? `https://www.youtube-nocookie.com/embed/${campaign.videoUrl.split("v=")[1]?.split("&")[0]}`
        : campaign.videoUrl
    : null;

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!isConnected) {
      toast.error("Please connect your Stellar wallet to comment");
      return;
    }
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });
      if (res.ok) {
        setNewComment("");
        toast.success("Comment posted!");
        refetch();
      }
    } catch {
      toast.error("Failed to post comment");
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Campaign link copied to clipboard!");
  };

  const toggleBookmark = async () => {
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
    <Container className="py-10 space-y-10 max-w-6xl">
      {/* Breadcrumb + header */}
      <div className="space-y-4">
        <Link href="/campaigns" className="inline-flex items-center gap-1.5 text-[13px] text-fg-faint hover:text-fg transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to campaigns
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent">{campaign.category}</Badge>
          <Badge tone="success" icon={<ShieldCheck className="w-3 h-3" />}>
            Soroban Escrow
          </Badge>
        </div>
        <h1 className="font-display text-3xl sm:text-[40px] leading-tight font-semibold text-fg max-w-3xl">
          {campaign.title}
        </h1>
        <p className="text-[15px] text-fg-muted leading-relaxed max-w-2xl">{campaign.shortDescription}</p>
      </div>

      {/* Media + funding */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Media column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative w-full h-[320px] sm:h-[400px] rounded-card overflow-hidden panel">
            <Image
              src={campaign.coverImage}
              alt={campaign.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 58vw"
            />
          </div>

          {videoEmbed && (
            <div className="relative w-full aspect-video rounded-card overflow-hidden panel bg-black">
              <iframe
                src={videoEmbed}
                title="Campaign demo video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
              />
            </div>
          )}

          {galleryImages.length > 0 && (
            <div className="grid grid-cols-4 gap-3">
              {galleryImages.map((img, idx) => (
                <div key={idx} className="relative h-20 rounded-box overflow-hidden panel">
                  <Image src={img} alt={`Gallery ${idx + 1}`} fill className="object-cover" sizes="(max-width: 768px) 25vw, 160px" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Funding panel */}
        <div className="lg:col-span-5">
          <div className="panel p-6 sm:p-7 space-y-6 lg:sticky lg:top-24">
            {/* Creator */}
            <div className="flex items-center justify-between pb-5 border-b border-line">
              <div className="flex items-center gap-3">
                <Avatar src={campaign.creator?.avatar} name={campaign.creator?.name} size={40} />
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-fg">
                    {campaign.creator?.name}
                    {campaign.verified && <BadgeCheck className="w-4 h-4 text-network" />}
                  </p>
                  <p className="text-[11px] text-fg-faint">Verified Stellar Creator</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {campaign.website && (
                  <a href={campaign.website} target="_blank" rel="noreferrer" aria-label="Website" className="flex h-8 w-8 items-center justify-center rounded-[9px] border border-line bg-surface text-fg-muted hover:text-fg hover:border-line-strong transition-colors">
                    <Globe className="w-4 h-4" />
                  </a>
                )}
                {campaign.github && (
                  <a href={campaign.github} target="_blank" rel="noreferrer" aria-label="GitHub" className="flex h-8 w-8 items-center justify-center rounded-[9px] border border-line bg-surface text-fg-muted hover:text-fg hover:border-line-strong transition-colors">
                    <Github className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Raised */}
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-[30px] font-semibold text-fg tabular">
                  {formatXlm(campaign.raisedAmount)} <span className="text-sm text-accent font-medium">XLM</span>
                </span>
                <span className="text-[12px] font-semibold text-network tabular">{progressPercent}% funded</span>
              </div>
              <Progress value={progressPercent} size="lg" />
              <p className="text-[12px] text-fg-faint">
                Goal of <span className="text-fg-muted tabular">{formatXlm(campaign.fundingGoal)} XLM</span>
              </p>
            </div>

            {/* Backers / time */}
            <div className="grid grid-cols-2 gap-4 py-4 border-y border-line">
              <div>
                <p className="flex items-center gap-1.5 font-display text-xl font-semibold text-fg tabular">
                  <Users className="w-4 h-4 text-network" /> {backers}
                </p>
                <p className="text-[11px] text-fg-faint mt-0.5">Total backers</p>
              </div>
              <div>
                <p className={cn("flex items-center gap-1.5 font-display text-xl font-semibold tabular", diffDays > 0 ? "text-warning" : "text-fg-faint")}>
                  <Clock className="w-4 h-4" /> {diffDays > 0 ? `${diffDays}` : "Ended"}
                </p>
                <p className="text-[11px] text-fg-faint mt-0.5">{diffDays > 0 ? "Days remaining" : "Campaign closed"}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                size="lg"
                onClick={() => setIsDonateOpen(true)}
                disabled={diffDays <= 0}
                icon={<Heart className="w-[18px] h-[18px] fill-current" />}
                className="w-full"
              >
                {diffDays > 0 ? "Back this Campaign" : "Campaign Ended"}
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" size="sm" onClick={copyShareLink} icon={<Share2 className="w-4 h-4" />}>
                  Share
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleBookmark}
                  icon={<Bookmark className={cn("w-4 h-4", isBookmarked && "fill-current text-accent")} />}
                >
                  {isBookmarked ? "Saved" : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="space-y-6">
        <Tabs<TabKey>
          value={activeTab}
          onChange={setActiveTab}
          items={[
            { value: "story", label: "Story" },
            { value: "milestones", label: "Milestones", count: campaign.milestones?.length },
            { value: "updates", label: "Updates", count: campaign.updates?.length },
            { value: "comments", label: "Comments", count: campaign.comments?.length },
            { value: "rewards", label: "Rewards", count: campaign.rewardTiers?.length },
          ]}
        />

        <div className="panel p-7 sm:p-8">
          {activeTab === "story" && (
            <div className="max-w-none text-[14px] leading-[1.8] text-fg-muted whitespace-pre-line">
              {campaign.story}
            </div>
          )}

          {activeTab === "milestones" && (
            <div className="space-y-4">
              {campaign.milestones?.length === 0 ? (
                <p className="text-sm text-fg-faint">No milestones published yet.</p>
              ) : (
                campaign.milestones?.map((m: any, idx: number) => (
                  <div key={m.id} className="flex items-start gap-4 rounded-box border border-line bg-surface-2/40 p-5">
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold",
                        m.completed ? "bg-success/15 text-success border border-success/30" : "bg-surface-2 text-fg-faint border border-line-strong"
                      )}
                    >
                      {m.completed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </span>
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold text-fg">{m.title}</h4>
                        <span className="text-[12px] font-semibold text-accent tabular">{formatXlm(m.targetAmount)} XLM</span>
                      </div>
                      <p className="text-[13px] text-fg-muted leading-relaxed">{m.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "updates" && (
            <div className="space-y-4">
              {campaign.updates?.length === 0 ? (
                <p className="text-sm text-fg-faint">No updates posted yet.</p>
              ) : (
                campaign.updates?.map((u: any) => (
                  <div key={u.id} className="rounded-box border border-line bg-surface-2/40 p-5 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold text-fg">{u.title}</h4>
                      <span className="text-[11px] text-fg-faint">{new Date(u.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-[13px] text-fg-muted leading-relaxed">{u.content}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "comments" && (
            <div className="space-y-6">
              <form onSubmit={handleAddComment} className="flex gap-3">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a message to support the creator…"
                  className="field flex-1 px-4 py-3 text-sm"
                />
                <Button type="submit" icon={<Send className="w-4 h-4" />}>
                  Post
                </Button>
              </form>
              <div className="space-y-3">
                {campaign.comments?.length ? (
                  campaign.comments?.map((c: any) => (
                    <div key={c.id} className="rounded-box border border-line bg-surface-2/40 p-4 space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar src={c.user?.avatar} name={c.user?.name} size={24} />
                        <span className="text-[13px] font-semibold text-fg">{c.user?.name || "Stellar Supporter"}</span>
                        <span className="text-[10px] text-fg-faint">{new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[13px] text-fg-muted leading-relaxed">{c.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-fg-faint">Be the first to comment.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === "rewards" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaign.rewardTiers?.length ? (
                campaign.rewardTiers?.map((r: any) => (
                  <div key={r.id} className="rounded-box border border-line bg-surface-2/40 p-5 space-y-3 flex flex-col">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[15px] font-semibold text-fg">{r.title}</h4>
                      <span className="font-display text-sm font-semibold text-accent tabular">{formatXlm(r.minAmount)} XLM+</span>
                    </div>
                    <p className="text-[13px] text-fg-muted leading-relaxed flex-1">{r.description}</p>
                    <Button variant="secondary" size="sm" onClick={() => setIsDonateOpen(true)}>
                      Select Tier
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-fg-faint">No reward tiers available.</p>
              )}
            </div>
          )}
        </div>
      </div>

      <DonateModal
        campaign={campaign}
        isOpen={isDonateOpen}
        onClose={() => setIsDonateOpen(false)}
        onSuccess={() => refetch()}
      />
    </Container>
  );
}
