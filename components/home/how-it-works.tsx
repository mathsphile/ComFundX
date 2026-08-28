"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Compass,
  FileSearch,
  Wallet,
  HeartHandshake,
  BadgeCheck,
  Banknote,
} from "lucide-react";
import { DUR, EASE, VIEWPORT } from "@/lib/motion";

const STEPS = [
  {
    icon: Compass,
    title: "Discover",
    desc: "Browse live campaigns by category, deadline, and funding status.",
  },
  {
    icon: FileSearch,
    title: "Choose a campaign",
    desc: "Read the story, check the goal, the deadline, and the creator.",
  },
  {
    icon: Wallet,
    title: "Connect wallet",
    desc: "Freighter signs you in — no email, no password, no middleman.",
  },
  {
    icon: HeartHandshake,
    title: "Contribute",
    desc: "Sign one transaction. Your XLM moves into contract escrow.",
  },
  {
    icon: BadgeCheck,
    title: "Confirmed on Stellar",
    desc: "The ledger records your contribution with a public tx hash.",
  },
  {
    icon: Banknote,
    title: "Goal or refund",
    desc: "Goal reached: the creator withdraws. Missed: you're refunded in full.",
  },
];

/**
 * The full funding journey in one scroll-triggered flow. A connecting
 * rail draws itself across the steps as they enter the viewport.
 */
export function HowItWorksFlow() {
  const reducedMotion = useReducedMotion();

  return (
    <div className="relative">
      {/* Connecting rail (desktop) */}
      <div className="absolute hidden md:block inset-x-10 top-6 h-px bg-line" aria-hidden="true">
        <motion.div
          className="h-full bg-line-bright"
          style={{ transformOrigin: "left" }}
          initial={reducedMotion ? { scaleX: 1 } : { scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={VIEWPORT}
          transition={{ duration: DUR.crawl * 1.6, ease: EASE }}
        />
      </div>

      <ol className="grid grid-cols-1 gap-8 md:grid-cols-6 md:gap-4">
        {STEPS.map((step, i) => (
          <motion.li
            key={step.title}
            initial={reducedMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT}
            transition={{ duration: DUR.slow, delay: i * 0.09, ease: EASE }}
            className="relative flex items-start gap-4 md:flex-col md:items-center md:text-center"
          >
            <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-line-strong bg-surface">
              <step.icon className="h-5 w-5 text-fg" aria-hidden="true" />
            </span>
            <span className="md:mt-1">
              <span className="block text-sm font-semibold text-fg">{step.title}</span>
              <span className="mt-1 block text-[13px] leading-relaxed text-fg-muted">{step.desc}</span>
            </span>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
