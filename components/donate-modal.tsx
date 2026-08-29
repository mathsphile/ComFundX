"use client";

import { useState } from "react";
import { Wallet, ShieldCheck, CheckCircle2, Check, ExternalLink } from "lucide-react";
import { Address, nativeToScVal } from "@stellar/stellar-sdk";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { useWalletStore } from "@/lib/store/walletStore";
import { buildContractCallXdr, submitSignedTransaction } from "@/lib/stellar/soroban";
import { signTransactionXdr } from "@/lib/stellar/wallet";
import { STELLAR_CONFIG } from "@/lib/stellar/config";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { DUR, EASE } from "@/lib/motion";
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

const stepMotion = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: DUR.base, ease: EASE },
};

/**
 * Transaction wait-state choreography. Blockchain waits are where motion
 * matters most: an orbital loader plus a live checklist tells the backer
 * exactly which phase their XLM is in — building, signing, broadcasting.
 */
function TxPipeline({ stage }: { stage: 1 | 2 }) {
  const stages = [
    "Preparing your contribution",
    "Wallet approval",
    "Submitting to Stellar",
    "Confirming in escrow",
  ];

  return (
    <div className="py-8 flex flex-col items-center text-center space-y-8">
      {/* Orbital loader */}
      <div className="relative h-20 w-20" aria-hidden="true">
        <motion.span
          className="absolute inset-0 rounded-full border border-dashed border-network/40"
          animate={{ rotate: 360 }}
          transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
        />
        <motion.span
          className="absolute inset-2.5 rounded-full border border-dashed border-accent/50"
          animate={{ rotate: -360 }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
        />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="h-3 w-3 rounded-full bg-accent animate-pulse-dot" />
        </span>
      </div>

      <ol className="w-full max-w-xs space-y-3 text-left" aria-live="polite">
        {stages.map((label, i) => {
          const done = i < stage;
          const active = i === stage;
          return (
            <li
              key={label}
              className={cn(
                "flex items-center gap-3 text-[13px] transition-colors",
                done ? "text-success" : active ? "text-fg" : "text-fg-faint"
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                  done && "border-success/40 bg-success/15",
                  active && "border-accent/50 bg-accent/10",
                  !done && !active && "border-line bg-surface"
                )}
              >
                {done ? (
                  <Check className="w-3.5 h-3.5" />
                ) : active ? (
                  <motion.span
                    className="h-2 w-2 rounded-full bg-accent"
                    animate={{ scale: [1, 1.45, 1], opacity: [1, 0.55, 1] }}
                    transition={{ duration: 1.1, repeat: Infinity }}
                  />
                ) : (
                  <span className="text-[10px] font-mono">{i + 1}</span>
                )}
              </span>
              {label}
            </li>
          );
        })}
      </ol>

      <p className="text-[12px] text-fg-muted max-w-xs leading-relaxed">
        {stage === 1
          ? "Confirm this contribution in your wallet when prompted."
          : "Waiting for Stellar confirmation — your XLM is being locked into the campaign escrow. This usually takes a few seconds."}
      </p>
    </div>
  );
}

export function DonateModal({ campaign, isOpen, onClose, onSuccess }: DonateModalProps) {
  const { isConnected, publicKey, connect } = useWalletStore();
  const [amount, setAmount] = useState<string>("50");
  const [selectedReward, setSelectedReward] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptTx, setReceiptTx] = useState<string | null>(null);
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
          // Campaigns without their own escrow fall back to the platform's
          // receiving campaign (on-chain id 3) — always ACTIVE on the
          // deployed contract.
          nativeToScVal(BigInt(campaign.onChainId ?? 3), { type: "u64" }),
          nativeToScVal(stroops, { type: "i128" }),
        ],
      });

      let signedXdr: string | null = null;
      try {
        signedXdr = await signTransactionXdr(xdr, publicKey);
      } catch {
        signedXdr = null;
      }
      if (!signedXdr) {
        throw new Error("The transaction was not signed. Confirm it in your wallet and try again.");
      }

      setStep("CONFIRMING");

      // Submit the signed transaction to Stellar and record the real hash.
      const submission = await submitSignedTransaction(signedXdr);
      if (submission.status !== "SUCCESS") {
        throw new Error(`Donation transaction ${submission.status.toLowerCase()} on Stellar`);
      }
      const txHash = submission.hash;

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

      setReceiptTx(txHash);
      setStep("SUCCESS");
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

      toast.success("Donation Successful!", {
        description: `Successfully donated ${numAmount} XLM to "${campaign.title}" via Soroban escrow contract!`,
      });

      setTimeout(() => {
        onSuccess();
        onClose();
        setStep("SELECT");
        setReceiptTx(null);
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

        <AnimatePresence mode="wait" initial={false}>
          {step === "SELECT" && (
            <motion.div key="select" {...stepMotion}>
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
            </motion.div>
          )}

          {(step === "SIGNING" || step === "CONFIRMING") && (
            <motion.div key="processing" {...stepMotion}>
              <TxPipeline stage={step === "SIGNING" ? 1 : 2} />
            </motion.div>
          )}

          {step === "SUCCESS" && (
            <motion.div key="success" {...stepMotion}>
              <div className="py-12 flex flex-col items-center text-center space-y-5">
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.05 }}
                  className="flex h-16 w-16 items-center justify-center rounded-full border border-success/30 bg-success/15"
                >
                  <CheckCircle2 className="w-8 h-8 text-success" />
                </motion.div>
                <div className="space-y-1.5">
                  <h4 className="font-display text-xl font-semibold text-fg">Contribution confirmed</h4>
                  <p className="text-[13px] text-fg-muted">
                    You donated <span className="font-semibold text-fg tabular">{amount} XLM</span> to {campaign.title}.
                    The escrow holds it until the campaign reaches its goal.
                  </p>
                </div>
                {receiptTx && (
                  <a
                    href={`${STELLAR_CONFIG.explorerUrl}/tx/${receiptTx}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[12px] font-medium text-network underline-offset-2 hover:underline"
                  >
                    View receipt on Stellar Expert
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
}
