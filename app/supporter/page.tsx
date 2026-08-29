"use client";

import Link from "next/link";
import { HeartHandshake, RefreshCw, ExternalLink, Wallet } from "lucide-react";
import { useWalletStore } from "@/lib/store/walletStore";
import { STELLAR_CONFIG } from "@/lib/stellar/config";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { EmptyState } from "@/components/ui/empty-state";
import { Container } from "@/components/ui/container";
import { formatXlm } from "@/lib/utils";

export default function SupporterPortalPage() {
  const { isConnected, publicKey, connect } = useWalletStore();

  const { data, refetch } = useQuery({
    queryKey: ["supporter-portal", publicKey],
    enabled: !!isConnected,
    queryFn: async () => {
      const res = await fetch("/api/campaigns");
      if (!res.ok) throw new Error("Failed to fetch supporter data");
      return res.json();
    },
  });

  const campaigns = data?.campaigns || [];

  const myDonations = campaigns
    .flatMap((c: any) =>
      (c.donations ?? [])
        .filter((d: any) => d.contributorAddress === publicKey)
        .map((d: any) => ({ ...d, campaign: c }))
    )
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const failedCampaigns = campaigns.filter(
    (c: any) =>
      c.status === "FAILED" &&
      (c.donations ?? []).some((d: any) => d.contributorAddress === publicKey)
  );

  const handleClaimRefund = async (campaignId: string, campaignTitle: string) => {
    toast.loading(`Executing Soroban contract refund claim for "${campaignTitle}"...`, { id: "refund" });
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/refund`, { method: "POST" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Refund failed");

      toast.success("Refund Claimed Successfully!", {
        id: "refund",
        description: result.message || "XLM refunded directly to your Stellar wallet!",
      });
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to claim refund", { id: "refund" });
    }
  };

  if (!isConnected) {
    return (
      <Container className="py-24 max-w-md">
        <EmptyState
          icon={<HeartHandshake className="w-5 h-5" />}
          title="Connect your Stellar wallet"
          description="Connect your wallet to view your donation history and claim 100% smart-contract refunds."
          action={<Button onClick={connect} icon={<Wallet className="w-4 h-4" />}>Connect Wallet</Button>}
        />
      </Container>
    );
  }

  return (
    <Container className="py-12 space-y-10">
      {/* Header */}
      <div className="space-y-3 max-w-2xl">
        <p className="eyebrow">Supporter Portal</p>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-fg">
          Donations & Refunds
        </h1>
        <p className="text-sm text-fg-muted leading-relaxed">
          Track your contributions and claim zero-middleman refunds for campaigns that missed their funding goal.
        </p>
      </div>

      {/* Refund center */}
      <Surface padded className="space-y-6">
        <div className="flex items-center gap-3.5">
          <span className="flex h-11 w-11 items-center justify-center rounded-[12px] border border-warning/30 bg-warning/10 text-warning">
            <RefreshCw className="w-5 h-5" />
          </span>
          <div>
            <h3 className="font-display text-lg font-semibold text-fg">Refund Center</h3>
            <p className="text-[12px] text-fg-faint">Campaigns eligible for a 100% automated refund</p>
          </div>
        </div>

        {failedCampaigns.length === 0 ? (
          <div className="rounded-[12px] border border-line bg-surface-2/40 p-6 text-center space-y-1">
            <p className="text-[13px] font-semibold text-fg">No refunds required</p>
            <p className="text-[12px] text-fg-muted">All your backed campaigns are active or successfully funded.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {failedCampaigns.map((fc: any) => (
              <div
                key={fc.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[12px] border border-warning/30 bg-warning/8 p-5"
              >
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-fg">{fc.title}</h4>
                  <p className="text-[12px] text-fg-muted">
                    Expired {new Date(fc.deadline).toLocaleDateString()} · Raised {formatXlm(fc.raisedAmount)} /{" "}
                    {formatXlm(fc.fundingGoal)} XLM
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => handleClaimRefund(fc.id, fc.title)}
                  icon={<RefreshCw className="w-4 h-4 text-warning" />}
                >
                  Claim Refund
                </Button>
              </div>
            ))}
          </div>
        )}
      </Surface>

      {/* Donation history */}
      <Surface padded className="space-y-6">
        <h3 className="font-display text-lg font-semibold text-fg">Contribution History</h3>
        {myDonations.length === 0 ? (
          <div className="rounded-[12px] border border-line bg-surface-2/40 p-6 text-center space-y-3">
            <p className="text-[13px] font-semibold text-fg">No contributions yet</p>
            <p className="text-[12px] text-fg-muted">
              Back a campaign and your on-chain contributions will appear here.
            </p>
            <Button href="/campaigns" variant="secondary" size="sm">
              Explore Campaigns
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-left min-w-[560px]">
              <thead>
                <tr className="border-b border-line text-[11px] uppercase tracking-wider text-fg-faint font-mono">
                  <th className="pb-3 pr-4 font-medium">Campaign</th>
                  <th className="pb-3 pr-4 font-medium">Amount</th>
                  <th className="pb-3 pr-4 font-medium">Date</th>
                  <th className="pb-3 font-medium">Explorer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {myDonations.map((d: any) => (
                  <tr key={d.id} className="hover:bg-surface-2/30 transition-colors">
                    <td className="py-4 pr-4">
                      <Link href={`/campaigns/${d.campaign.slug}`} className="text-[13px] font-semibold text-fg hover:text-accent-strong transition-colors line-clamp-1">
                        {d.campaign.title}
                      </Link>
                    </td>
                    <td className="py-4 pr-4 text-[13px] font-semibold text-accent tabular whitespace-nowrap">
                      {formatXlm(d.amount)} XLM
                    </td>
                    <td className="py-4 pr-4 text-[12px] text-fg-muted whitespace-nowrap">
                      {new Date(d.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4">
                      <a
                        href={
                          d.txHash
                            ? `${STELLAR_CONFIG.explorerUrl}/tx/${d.txHash}`
                            : `${STELLAR_CONFIG.explorerUrl}/account/${publicKey}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-network hover:text-fg transition-colors"
                      >
                        {d.txHash ? "View tx" : "Account"} <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Surface>
    </Container>
  );
}
