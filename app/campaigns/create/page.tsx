"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Rocket, Check, ArrowRight, ArrowLeft, ShieldCheck, Upload } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useWalletStore } from "@/lib/store/walletStore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Container } from "@/components/ui/container";
import { AmbientField } from "@/components/ambient-field";
import { DUR, EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

const CATEGORIES = ["Technology", "AI", "Web3", "Education", "Gaming", "Open Source"];
const STEP_LABELS = ["Basic Details", "Goal & Timing", "Story & Media", "Publish"];

export default function CreateCampaignPage() {
  const router = useRouter();
  const { isConnected, publicKey, connect } = useWalletStore();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    shortDescription: "",
    story: "",
    category: "Technology",
    fundingGoal: "10000",
    deadlineDays: "30",
    coverImage:
      "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&auto=format&fit=crop&q=80",
    videoUrl: "",
    website: "",
    github: "",
    twitter: "",
    discord: "",
    milestones: [
      { title: "Alpha Deployment", description: "Deploy prototype to Soroban Testnet", targetAmount: "3000" },
    ],
    rewardTiers: [
      { title: "Early Supporter", description: "Receive official Discord role and early access pass", minAmount: "100" },
    ],
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    toast.loading("Uploading cover image...", { id: "upload" });
    const data = new FormData();
    data.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: data });
      const result = await res.json();
      if (result.url) {
        setFormData({ ...formData, coverImage: result.url });
        toast.success("Image uploaded successfully!", { id: "upload" });
      }
    } catch {
      toast.error("Failed to upload image", { id: "upload" });
    }
  };

  const handlePublish = async () => {
    if (!isConnected || !publicKey) {
      toast.error("Please connect your Stellar wallet first");
      await connect();
      return;
    }

    if (!formData.title || !formData.shortDescription || !formData.story || !formData.fundingGoal) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    toast.loading("Deploying Soroban smart contract escrow & publishing campaign...", { id: "publish" });

    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-wallet-address": publicKey },
        body: JSON.stringify({ ...formData, publicKey }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Campaign creation failed");

      toast.success("Campaign Published Live on Soroban!", {
        id: "publish",
        description: `Your campaign "${data.campaign.title}" is live on Stellar!`,
      });

      router.push(`/campaigns/${data.campaign.slug}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to publish campaign", { id: "publish" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container className="relative isolate py-12 max-w-3xl space-y-8">
      {/* Ambient depth behind the studio header */}
      <div className="pointer-events-none absolute inset-x-0 -top-12 -z-10 h-[380px]">
        <AmbientField className="h-full w-full" count={50} />
      </div>

      {/* Header */}
      <div className="space-y-3 text-center max-w-xl mx-auto">
        <p className="eyebrow">Creator Studio</p>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-fg">
          Launch a Project on Stellar
        </h1>
        <p className="text-sm text-fg-muted">
          Set a goal, tell your story, publish — the escrow contract is provisioned automatically.
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between gap-2">
        {STEP_LABELS.map((label, idx) => {
          const n = idx + 1;
          const state = n === step ? "active" : n < step ? "done" : "todo";
          return (
            <div key={label} className="flex items-center gap-2 flex-1 last:flex-none">
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[12px] font-semibold transition-colors",
                    state === "active" && "bg-accent text-fg-on-accent border-transparent",
                    state === "done" && "bg-success/15 text-success border-success/40",
                    state === "todo" && "bg-surface text-fg-faint border-line-strong"
                  )}
                >
                  {state === "done" ? <Check className="w-4 h-4" /> : n}
                </span>
                <span
                  className={cn(
                    "hidden sm:block text-[12px] font-medium whitespace-nowrap",
                    state === "active" ? "text-fg" : state === "done" ? "text-success" : "text-fg-faint"
                  )}
                >
                  {label}
                </span>
              </div>
              {idx < STEP_LABELS.length - 1 && (
                <span className="relative h-px flex-1 mx-1 overflow-hidden bg-line">
                  <motion.span
                    className="absolute inset-y-0 left-0 bg-success/60"
                    initial={false}
                    animate={{ width: n < step ? "100%" : "0%" }}
                    transition={{ duration: DUR.base, ease: EASE }}
                  />
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className="panel p-6 sm:p-8 space-y-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 26 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: DUR.base, ease: EASE }}
          >
        {step === 1 && (
          <div className="space-y-5">
            <h3 className="font-display text-lg font-semibold text-fg">Campaign Information</h3>
            <Field label="Campaign Title" required>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Soroban Pay: Sub-Second Micropayments Protocol"
              />
            </Field>

            <Field label="Category" required>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat })}
                    className={cn(
                      "rounded-[10px] border py-2 text-[12px] font-medium transition-all",
                      formData.category === cat
                        ? "bg-accent text-fg-on-accent border-transparent"
                        : "bg-surface text-fg-muted border-line-strong hover:text-fg hover:border-line-bright"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Short Summary" required hint="1–2 sentences">
              <Textarea
                rows={2}
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                placeholder="A high-level summary of your project vision and goals…"
              />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h3 className="font-display text-lg font-semibold text-fg">Funding Target & Timeline</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Funding Goal" required>
                <div className="relative">
                  <Input
                    type="number"
                    min="100"
                    value={formData.fundingGoal}
                    onChange={(e) => setFormData({ ...formData, fundingGoal: e.target.value })}
                    className="pr-16 tabular font-semibold"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-accent">XLM</span>
                </div>
              </Field>
              <Field label="Duration (Days)" required>
                <Input
                  type="number"
                  min="7"
                  max="90"
                  value={formData.deadlineDays}
                  onChange={(e) => setFormData({ ...formData, deadlineDays: e.target.value })}
                  className="tabular font-semibold"
                />
              </Field>
            </div>

            <div className="rounded-[12px] border border-success/25 bg-success/8 p-4 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 shrink-0 text-success" />
              <div>
                <p className="text-[13px] font-semibold text-success">Automated escrow guarantee</p>
                <p className="mt-1 text-[12px] text-fg-muted leading-relaxed">
                  Funds lock in the Soroban escrow for {formData.deadlineDays} days. Reach {formData.fundingGoal} XLM
                  and you can withdraw immediately; otherwise backers are refunded automatically.
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h3 className="font-display text-lg font-semibold text-fg">Story & Media</h3>

            <Field label="Cover Image" required>
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-32 overflow-hidden rounded-box border border-line">
                  <Image src={formData.coverImage} alt="Cover preview" fill className="object-cover" sizes="128px" />
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-[10px] border border-line-strong bg-surface px-4 py-2.5 text-[13px] font-medium text-fg transition-colors hover:border-line-bright">
                  <Upload className="w-4 h-4 text-fg-muted" />
                  Upload Image
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
            </Field>

            <Field label="Project Story" required hint="Markdown supported">
              <Textarea
                rows={6}
                value={formData.story}
                onChange={(e) => setFormData({ ...formData, story: e.target.value })}
                placeholder="Explain what you're building, why Stellar, and how funds will be used…"
                className="font-mono text-[13px]"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="Website URL"
              />
              <Input
                value={formData.github}
                onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                placeholder="GitHub Repo URL"
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <h3 className="font-display text-lg font-semibold text-fg">Review & Publish</h3>
            <div className="rounded-[12px] border border-line bg-surface-2/40 divide-y divide-line">
              {[
                ["Campaign Title", formData.title || "—"],
                ["Funding Goal", `${formData.fundingGoal} XLM`],
                ["Category", formData.category],
                ["Duration", `${formData.deadlineDays} days`],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between px-4 py-3">
                  <span className="text-[12px] text-fg-faint">{k}</span>
                  <span className="text-[13px] font-semibold text-fg">{v}</span>
                </div>
              ))}
            </div>
            <Button size="lg" onClick={handlePublish} loading={isSubmitting} icon={<Rocket className="w-[18px] h-[18px]" />} className="w-full">
              Publish & Deploy Contract
            </Button>
          </div>
        )}
          </motion.div>
        </AnimatePresence>

        {/* Stepper controls */}
        <div className="flex items-center justify-between pt-4 border-t border-line">
          {step > 1 ? (
            <Button variant="secondary" size="sm" onClick={() => setStep(step - 1)} icon={<ArrowLeft className="w-4 h-4" />}>
              Previous
            </Button>
          ) : (
            <span />
          )}
          {step < 4 && (
            <Button size="sm" onClick={() => setStep(step + 1)} icon={<ArrowRight className="w-4 h-4" />} iconPosition="right">
              Next Step
            </Button>
          )}
        </div>
      </div>
    </Container>
  );
}
