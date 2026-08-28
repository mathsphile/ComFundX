"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { DUR, EASE } from "@/lib/motion";

const FAQS = [
  {
    q: "What is FundX?",
    a: "A crowdfunding platform on Stellar. Creators launch campaigns with an XLM funding goal and a deadline; backers contribute through their wallet. A Soroban smart contract holds every contribution in escrow and settles the outcome — payout or refund — by code, not by a platform decision.",
  },
  {
    q: "How does crowdfunding work here?",
    a: "It's all-or-nothing by design. If the campaign reaches its goal, the creator withdraws the total raised. If the deadline passes with the goal unmet, every contributor can claim a full refund directly from the contract. Funds never sit in a platform account.",
  },
  {
    q: "What is Stellar, and why use it?",
    a: "Stellar is an open financial network built for payments: ledgers close roughly every five seconds and transaction fees are a tiny fraction of a cent. That makes small contributions practical and settlement fast enough to feel instant.",
  },
  {
    q: "Do I need a wallet?",
    a: "Yes — a Stellar wallet such as Freighter. Your wallet is your account: it signs you in and signs your contributions. There are no email sign-ups, and FundX never holds your keys or your funds.",
  },
  {
    q: "How are contributions processed?",
    a: "When you contribute, FundX builds a transaction calling the escrow contract, your wallet signs it, and it is submitted to Stellar. Once confirmed, your XLM is held by the contract and the contribution is recorded with its transaction hash.",
  },
  {
    q: "Where can I verify transactions?",
    a: "Everything is public on the Stellar ledger. Campaign pages link to the escrow contract, and your supporter portal links each contribution to Stellar Expert, where you can inspect the exact transaction.",
  },
  {
    q: "What happens when a campaign reaches its goal?",
    a: "The creator becomes eligible to withdraw the total raised. Withdrawal is one-shot and creator-only — enforced by the contract, not the interface. After a withdrawal, further contributions and refunds are closed.",
  },
  {
    q: "What happens when a campaign expires?",
    a: "If the deadline passes without reaching the goal, contributors can claim a full refund from the contract — no approval needed. Refunds return exactly what you contributed and can be claimed once per contributor.",
  },
  {
    q: "What fees are involved?",
    a: "FundX charges no platform fee. You only pay the standard Stellar network fee per transaction — a tiny fraction of a cent.",
  },
];

/** Interactive FAQ accordion — one open item, animated height. */
export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const reducedMotion = useReducedMotion();

  return (
    <div className="divide-y divide-line border-y border-line">
      {FAQS.map((faq, i) => {
        const isOpen = open === i;
        return (
          <div key={faq.q}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 py-5 text-left"
            >
              <span className={cn("text-[15px] font-semibold transition-colors", isOpen ? "text-fg" : "text-fg-muted")}>
                {faq.q}
              </span>
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: DUR.fast, ease: EASE }}
                className="shrink-0 text-fg-faint"
                aria-hidden="true"
              >
                <ChevronDown className="h-4 w-4" />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="content"
                  initial={reducedMotion ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reducedMotion ? undefined : { height: 0, opacity: 0 }}
                  transition={{ duration: DUR.base, ease: EASE }}
                  className="overflow-hidden"
                >
                  <p className="pb-5 pr-8 text-sm leading-relaxed text-fg-muted">{faq.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
