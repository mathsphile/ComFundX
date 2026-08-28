"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Rocket, HeartHandshake } from "lucide-react";
import { cn } from "@/lib/utils";
import { DUR, EASE } from "@/lib/motion";

type Path = "creator" | "backer";

const PATHS: Record<Path, { title: string; steps: { title: string; desc: string }[] }> = {
  creator: {
    title: "For creators",
    steps: [
      { title: "Tell your story", desc: "Describe the project, add media, and set the category." },
      { title: "Set goal & deadline", desc: "A funding target in XLM and a deadline of up to 90 days." },
      { title: "Publish", desc: "Your campaign goes live with its escrow rules attached." },
      { title: "Receive contributions", desc: "Each contribution lands in the contract escrow, not a platform account." },
      { title: "Track progress", desc: "Follow funding, backers, and activity from your dashboard." },
      { title: "Reach goal & withdraw", desc: "Once the goal is met, withdraw the total raised. One transaction, creator-only." },
    ],
  },
  backer: {
    title: "For backers",
    steps: [
      { title: "Discover", desc: "Browse campaigns by category, deadline, and momentum." },
      { title: "Research", desc: "Read the story, milestones, and the creator's record." },
      { title: "Connect wallet", desc: "Freighter connects in seconds — your wallet is your account." },
      { title: "Contribute", desc: "Pick an amount, sign once. Funds move straight into escrow." },
      { title: "Track the campaign", desc: "Your contributions appear in your supporter portal with tx links." },
      { title: "Verify on Stellar", desc: "Every contribution is public on Stellar Expert. Missed goal? Claim a full refund." },
    ],
  },
};

/**
 * Two sides of the same escrow. Switching paths crossfades the journey
 * so both audiences immediately see themselves in the product.
 */
export function ExperiencePaths() {
  const [path, setPath] = useState<Path>("creator");
  const reducedMotion = useReducedMotion();
  const active = PATHS[path];

  return (
    <div className="panel overflow-hidden">
      {/* Switcher */}
      <div className="flex border-b border-line" role="tablist" aria-label="Choose an experience path">
        {(Object.keys(PATHS) as Path[]).map((key) => {
          const isActive = path === key;
          const Icon = key === "creator" ? Rocket : HeartHandshake;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={isActive}
              onClick={() => setPath(key)}
              className={cn(
                "relative flex flex-1 items-center justify-center gap-2 px-4 py-4 text-sm font-semibold transition-colors",
                isActive ? "text-fg" : "text-fg-faint hover:text-fg-muted"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {PATHS[key].title}
              {isActive && (
                <motion.span
                  layoutId="paths-tab"
                  className="absolute inset-x-6 -bottom-px h-[2px] rounded-full bg-fg"
                  transition={{ duration: DUR.fast, ease: EASE }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Steps */}
      <div className="p-6 sm:p-8">
        <AnimatePresence mode="wait" initial={false}>
          <motion.ol
            key={path}
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: DUR.base, ease: EASE }}
            className="grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2"
          >
            {active.steps.map((step, i) => (
              <motion.li
                key={step.title}
                initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: DUR.base, delay: i * 0.06, ease: EASE }}
                className="flex items-start gap-4"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 font-mono text-[12px] font-semibold text-fg-muted">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-fg">{step.title}</span>
                  <span className="mt-1 block text-[13px] leading-relaxed text-fg-muted">{step.desc}</span>
                </span>
              </motion.li>
            ))}
          </motion.ol>
        </AnimatePresence>
      </div>
    </div>
  );
}
