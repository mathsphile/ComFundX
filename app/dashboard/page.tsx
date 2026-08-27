"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  Users,
  Eye,
  Plus,
  Rocket,
  ShieldCheck,
  Send,
} from "lucide-react";
import { useWalletStore } from "@/lib/store/walletStore";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Surface } from "@/components/ui/surface";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Textarea } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { Container } from "@/components/ui/container";
import { formatXlm } from "@/lib/utils";

export default function CreatorDashboardPage() {
  const { isConnected, publicKey, connect } = useWalletStore();
  const [selectedCampaignForUpdate, setSelectedCampaignForUpdate] = useState<any | null>(null);
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateContent, setUpdateContent] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["creator-dashboard", publicKey],
    enabled: !!isConnected,
    queryFn: async () => {
      const res = await fetch("/api/campaigns");
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      return res.json();
    },
  });

  const campaigns = data?.campaigns || [];
  const totalRaised = campaigns.reduce((acc: number, c: any) => acc + c.raisedAmount, 0);
  const totalViews = campaigns.reduce((acc: number, c: any) => acc + (c.views || 0), 0);
  const totalBackers = new Set(
    campaigns.flatMap((c: any) => (c.donations ?? []).map((d: any) => d.contributorAddress))
  ).size;

  const handleWithdraw = async (campaignId: string, amount: number) => {
    toast.loading(`Executing Soroban contract withdrawal for ${formatXlm(amount)} XLM...`, { id: "withdraw" });
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/withdraw`, { method: "POST" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Withdrawal failed");

      toast.success("Funds Withdrawn Successfully!", {
        id: "withdraw",
        description: `${formatXlm(amount)} XLM transferred from Soroban escrow to your wallet!`,
      });
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to process withdrawal", { id: "withdraw" });
    }
  };

  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaignForUpdate || !updateTitle || !updateContent) return;

    try {
      const res = await fetch(`/api/campaigns/${selectedCampaignForUpdate.id}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: updateTitle, content: updateContent }),
      });
      if (res.ok) {
        toast.success("Campaign update published!");
        setSelectedCampaignForUpdate(null);
        setUpdateTitle("");
        setUpdateContent("");
        refetch();
      }
    } catch {
      toast.error("Failed to publish update");
    }
  };

  if (!isConnected) {
    return (
      <Container className="py-24 max-w-md">
        <EmptyState
          icon={<Wallet className="w-5 h-5" />}
          title="Connect your Stellar wallet"
          description="Connect your wallet to access your creator dashboard and manage Soroban withdrawals."
          action={<Button onClick={connect} icon={<Wallet className="w-4 h-4" />}>Connect Wallet</Button>}
        />
      </Container>
    );
  }

  return (
    <Container className="py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <p className="eyebrow">Creator Hub</p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-fg">
            Analytics & Management
          </h1>
        </div>
        <Button href="/campaigns/create" icon={<Plus className="w-4 h-4" />}>
          New Campaign
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Raised" value={`${formatXlm(totalRaised)} XLM`} icon={<TrendingUp className="w-4 h-4 text-accent" />} />
        <StatCard label="Total Backers" value={totalBackers.toLocaleString("en-US")} icon={<Users className="w-4 h-4 text-network" />} />
        <StatCard label="Page Views" value={formatXlm(totalViews)} icon={<Eye className="w-4 h-4 text-success" />} />
        <StatCard label="Active Campaigns" value={String(campaigns.length)} icon={<Rocket className="w-4 h-4 text-warning" />} />
      </div>

      {/* Campaigns table */}
      <Surface padded className="space-y-6">
        <h3 className="font-display text-lg font-semibold text-fg">Your Campaigns</h3>

        {isLoading ? (
          <p className="py-10 text-center text-sm text-fg-faint">Loading campaigns…</p>
        ) : campaigns.length === 0 ? (
          <p className="py-10 text-center text-sm text-fg-faint">You haven't launched any campaigns yet.</p>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-left min-w-[640px]">
              <thead>
                <tr className="border-b border-line text-[11px] uppercase tracking-wider text-fg-faint font-mono">
                  <th className="pb-3 pr-4 font-medium">Campaign</th>
                  <th className="pb-3 pr-4 font-medium">Raised / Goal</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {campaigns.map((c: any) => {
                  const isFunded = c.raisedAmount >= c.fundingGoal;
                  const isWithdrawn = c.status === "WITHDRAWN";
                  return (
                    <tr key={c.id} className="hover:bg-surface-2/30 transition-colors">
                      <td className="py-4 pr-4">
                        <Link href={`/campaigns/${c.slug}`} className="text-[13px] font-semibold text-fg hover:text-accent-strong transition-colors line-clamp-1">
                          {c.title}
                        </Link>
                      </td>
                      <td className="py-4 pr-4 text-[13px] tabular whitespace-nowrap">
                        <span className="text-accent font-semibold">{formatXlm(c.raisedAmount)}</span>
                        <span className="text-fg-faint"> / {formatXlm(c.fundingGoal)} XLM</span>
                      </td>
                      <td className="py-4 pr-4">
                        {isWithdrawn ? (
                          <Badge tone="network">Withdrawn</Badge>
                        ) : isFunded ? (
                          <Badge tone="success">Goal Met</Badge>
                        ) : (
                          <Badge tone="warning">Active</Badge>
                        )}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center justify-end gap-2">
                          {isFunded && !isWithdrawn && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleWithdraw(c.id, c.raisedAmount)}
                              icon={<ShieldCheck className="w-3.5 h-3.5 text-success" />}
                            >
                              Withdraw
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => setSelectedCampaignForUpdate(c)}>
                            Post Update
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Surface>

      {/* Post update modal */}
      <Modal open={!!selectedCampaignForUpdate} onClose={() => setSelectedCampaignForUpdate(null)} labelledBy="update-title">
        <div className="p-6 sm:p-8 space-y-5">
          <div className="space-y-1 pr-8">
            <h3 id="update-title" className="font-display text-lg font-semibold text-fg">Post Creator Update</h3>
            <p className="text-[12px] text-fg-faint line-clamp-1">{selectedCampaignForUpdate?.title}</p>
          </div>
          <form onSubmit={handlePostUpdate} className="space-y-4">
            <Field label="Title" required>
              <Input value={updateTitle} onChange={(e) => setUpdateTitle(e.target.value)} placeholder="Update title" />
            </Field>
            <Field label="Update" required>
              <Textarea
                rows={4}
                value={updateContent}
                onChange={(e) => setUpdateContent(e.target.value)}
                placeholder="Share progress or news with your backers…"
              />
            </Field>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" onClick={() => setSelectedCampaignForUpdate(null)}>
                Cancel
              </Button>
              <Button type="submit" icon={<Send className="w-4 h-4" />}>
                Publish Update
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </Container>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Surface padded className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-fg-faint">{label}</span>
        {icon}
      </div>
      <p className="font-display text-2xl font-semibold text-fg tabular">{value}</p>
    </Surface>
  );
}
