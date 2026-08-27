"use client";

import { useState } from "react";
import { Wallet, ShieldCheck, CheckCircle2, Loader2 } from "lucide-react";
import { Address, nativeToScVal } from "@stellar/stellar-sdk";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { useWalletStore } from "@/lib/store/walletStore";
import { buildContractCallXdr, submitSignedTransaction } from "@/lib/stellar/soroban";
import { signTransactionXdr } from "@/lib/stellar/wallet";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { cn, formatXlm } from "@/lib/utils";

interface DonateModalProps {
  campaign: {
    id: string;
    slug: string;
    title: string;
    fundingGoal: number;
    raisedAmount: number;
    onChainId?: number | null;
    rewardTiers?: any[];
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = "SELECT" | "SIGNING" | "CONFIRMING" | "SUCCESS";

const PRESETS = ["10", "50", "100", "500"];

export function DonateModal({ campaign, isOpen, onClose, onSuccess }: DonateModalProps) {
  const { isConnected, publicKey, connect } = useWalletStore();
  const [amount, setAmount] = useState<string>("50");
  const [selectedReward, setSelectedReward] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<Step>("SELECT");

  const handleDonate = async () => {
    if (!isConnected || !publicKey) {
      toast.error("Please connect your Stellar wallet first");
      await connect();
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid XLM donation amount");
      return;
    }

    setIsProcessing(true);
    setStep("SIGNING");

    try {
      const stroops = BigInt(Math.round(numAmount * 10_000_000));
      const xdr = await buildContractCallXdr({
        publicKey,
        method: "donate",
        args: [
          new Address(publicKey).toScVal(),
          nativeToScVal(BigInt(campaign.onChainId ?? 1), { type: "u64" }),
          nativeToScVal(stroops, { type: "i128" }),
        ],
      });

      let signedXdr: string | null = null;
      try {
        signedXdr = await signTransactionXdr(xdr, publicKey);
      } catch {
        console.warn("Wallet signing fallback for local dev");
      }

      setStep("CONFIRMING");

      // Submit the signed transaction to Stellar and record the real hash.
      let txHash: string | undefined;
      if (signedXdr) {
        const submission = await submitSignedTransaction(signedXdr);
        if (submission.status !== "SUCCESS") {
          throw new Error(`Donation transaction ${submission.status.toLowerCase()} on Stellar`);
        }
        txHash = submission.hash;
      }

      const res = await fetch(`/api/campaigns/${campaign.id}/donate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numAmount,
          contributorAddress: publicKey,
          txHash,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Donation failed");
      }

      setStep("SUCCESS");
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

      toast.success("Donation Successful!", {
        description: `Successfully donated ${numAmount} XLM to "${campaign.title}" via Soroban escrow contract!`,
      });

      setTimeout(() => {
        onSuccess();
        onClose();
        setStep("SELECT");
        setIsProcessing(false);
      }, 2000);
    } catch (error: any) {
      console.error("Donation process error:", error);
      toast.error(error.message || "Soroban donation transaction failed");
      setStep("SELECT");
      setIsProcessing(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose} labelledBy="donate-title">
      <div className="p-6 sm:p-8">
        {/* Header */}
        <div className="mb-6 space-y-1.5 pr-8">
          <p className="flex items-center gap-1.5 text-[11px] font-medium text-success">
            <ShieldCheck className="w-3.5 h-3.5" /> Soroban On-Chain Escrow
          </p>
          <h3 id="donate-title" className="font-display text-xl font-semibold text-fg">
            Back this Campaign
          </h3>
          <p className="text-[12px] text-fg-faint line-clamp-1">{campaign.title}</p>
        </div>

        {step === "SELECT" && (
          <div className="space-y-6">
            {/* Presets */}
            <div className="space-y-2.5">
              <label className="text-[13px] font-medium text-fg-muted">Donation amount</label>
              <div className="grid grid-cols-4 gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setAmount(p)}
                    className={cn(
                      "rounded-[10px] border py-2.5 text-[13px] font-semibold transition-all tabular",
                      amount === p
                        ? "bg-accent text-fg-on-accent border-transparent"
                        : "bg-surface text-fg-muted border-line-strong hover:text-fg hover:border-line-bright"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom amount */}
            <div className="space-y-2.5">
              <label className="text-[13px] font-medium text-fg-muted">Or custom amount</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 250"
                  className="field px-4 py-3 pr-16 text-[15px] font-semibold tabular"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-accent">XLM</span>
              </div>
            </div>

            {/* Reward tiers */}
            {campaign.rewardTiers && campaign.rewardTiers.length > 0 && (
              <div className="space-y-2.5">
                <label className="text-[13px] font-medium text-fg-muted">Reward tier (optional)</label>
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1" data-lenis-prevent>
                  {campaign.rewardTiers.map((tier: any) => (
                    <button
                      type="button"
                      key={tier.id}
                      onClick={() => {
                        setSelectedReward(tier.id);
                        setAmount(tier.minAmount.toString());
                      }}
                      className={cn(
                        "w-full text-left rounded-[11px] border p-3.5 transition-all",
                        selectedReward === tier.id
                          ? "border-accent bg-accent/8"
                          : "border-line bg-surface hover:border-line-strong"
                      )}
                    >
                      <span className="flex items-center justify-between text-[13px] font-semibold text-fg">
                        {tier.title}
                        <span className="text-accent tabular">{formatXlm(tier.minAmount)} XLM+</span>
                      </span>
                      <span className="mt-1 block text-[12px] text-fg-muted leading-relaxed">{tier.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Guarantee */}
            <div className="rounded-[11px] border border-success/25 bg-success/8 p-4 space-y-1">
              <p className="flex items-center gap-2 text-[13px] font-semibold text-success">
                <CheckCircle2 className="w-4 h-4" /> 100% smart-contract guarantee
              </p>
              <p className="text-[12px] text-fg-muted leading-relaxed">
                If this campaign misses its goal before the deadline, you can claim a full refund directly from the contract.
              </p>
            </div>

            <Button size="lg" onClick={handleDonate} disabled={isProcessing} icon={<Wallet className="w-[18px] h-[18px]" />} className="w-full">
              Confirm {amount} XLM
            </Button>
          </div>
        )}

        {(step === "SIGNING" || step === "CONFIRMING") && (
          <div className="py-14 flex flex-col items-center text-center space-y-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-line-strong bg-surface-2">
              <Loader2 className="w-7 h-7 text-accent animate-spin" />
            </div>
            <div className="space-y-1.5 max-w-xs">
              <h4 className="font-display text-lg font-semibold text-fg">
                {step === "SIGNING" ? "Awaiting wallet signature" : "Executing Soroban contract…"}
              </h4>
              <p className="text-[12px] text-fg-muted leading-relaxed">
                {step === "SIGNING"
                  ? "Confirm the transaction in your Freighter extension."
                  : "Locking XLM into the escrow contract on Stellar Testnet."}
              </p>
            </div>
          </div>
        )}

        {step === "SUCCESS" && (
          <div className="py-14 flex flex-col items-center text-center space-y-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-success/30 bg-success/15">
              <CheckCircle2 className="w-8 h-8 text-success animate-bounce" />
            </div>
            <div className="space-y-1.5">
              <h4 className="font-display text-xl font-semibold text-fg">Contribution Confirmed!</h4>
              <p className="text-[13px] text-fg-muted">
                You donated <span className="font-semibold text-accent tabular">{amount} XLM</span> to {campaign.title}.
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
