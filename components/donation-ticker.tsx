"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { shortAddress, formatXlm } from "@/lib/utils";
import { DUR, EASE } from "@/lib/motion";

interface TickerDonation {
  id: string;
  amount: number;
  contributorAddress: string;
}

/**
 * Live contribution ticker for the funding panel. Rotates through the
 * campaign's real on-chain donations every few seconds so the page reads
 * as alive; renders a static line with one donation and nothing with zero.
 */
export function DonationTicker({ donations }: { donations: TickerDonation[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (donations.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % donations.length), 4200);
    return () => clearInterval(timer);
  }, [donations.length]);

  if (donations.length === 0) return null;
  const donation = donations[index % donations.length];

  return (
    <div className="flex items-center gap-2.5 overflow-hidden rounded-[10px] border border-line bg-surface-2/40 px-3.5 py-2.5">
      <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
      </span>
      <AnimatePresence mode="wait">
        <motion.p
          key={donation.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: DUR.fast, ease: EASE }}
          className="min-w-0 truncate text-[12px] text-fg-muted"
          aria-live="polite"
        >
          <span className="font-mono text-fg">{shortAddress(donation.contributorAddress)}</span> backed{" "}
          <span className="font-semibold text-accent tabular">{formatXlm(donation.amount)} XLM</span>
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
