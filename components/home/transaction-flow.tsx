"use client";

import { Fragment, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Wallet, FileCode2, Network, Lock, Banknote, ExternalLink } from "lucide-react";
import { DUR, EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

const NODES = [
  { icon: Wallet, label: "Contributor wallet", sub: "Signs one transaction" },
  { icon: FileCode2, label: "FundX contract", sub: "Validates & accepts" },
  { icon: Network, label: "Stellar ledger", sub: "Confirms in ~5 seconds" },
  { icon: Lock, label: "Campaign escrow", sub: "Holds the XLM" },
  { icon: Banknote, label: "Outcome", sub: "Creator payout or refund" },
];

/** A real contribution confirmed on the deployed testnet contract. */
const EXAMPLE_TX = {
  hash: "b8d1207be0e28a57e6594595939c1a4d32616bccd786a5b84efa16934794b836",
  amount: "60",
};

/**
 * A contribution moving through the pipeline. The active stage advances
 * on a timer; reduced-motion users see the completed state.
 */
export function TransactionFlow() {
  const reducedMotion = useReducedMotion();
  const [active, setActive] = useState(reducedMotion ? NODES.length - 1 : 0);

  useEffect(() => {
    if (reducedMotion) return;
    const timer = setInterval(() => {
      setActive((a) => (a + 1) % (NODES.length + 1));
    }, 1100);
    return () => clearInterval(timer);
  }, [reducedMotion]);

  const wrapped = reducedMotion ? NODES.length - 1 : active % NODES.length;

  return (
    <div className="panel p-6 sm:p-10 space-y-10">
      {/* Pipeline */}
      <div className="overflow-x-auto pb-2 -mx-2 px-2" data-lenis-prevent>
        <div className="flex items-start min-w-[640px]">
          {NODES.map((node, i) => {
            const lit = reducedMotion || wrapped >= i;
            const current = !reducedMotion && wrapped === i;
            return (
              <Fragment key={node.label}>
                {i > 0 && (
                  <div className="relative mt-6 h-px flex-1 bg-line" aria-hidden="true">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-fg"
                      animate={{ width: lit ? "100%" : "0%" }}
                      transition={{ duration: DUR.base, ease: EASE }}
                    />
                  </div>
                )}
                <div className="flex w-28 shrink-0 flex-col items-center gap-3 text-center">
                  <span
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl border transition-colors duration-300",
                      lit ? "border-line-bright bg-surface-2 text-fg" : "border-line bg-surface text-fg-faint",
                      current && "border-fg"
                    )}
                  >
                    <node.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className={cn("block text-[12px] font-semibold transition-colors", lit ? "text-fg" : "text-fg-faint")}>
                      {node.label}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-fg-faint">{node.sub}</span>
                  </span>
                </div>
              </Fragment>
            );
          })}
        </div>
      </div>

      {/* Real receipt */}
      <div className="rounded-[10px] border border-line bg-bg-soft p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
        <span className="flex items-center gap-2 text-[12px] font-semibold text-success shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-dot" aria-hidden="true" />
          Real transaction · Testnet
        </span>
        <p className="text-[13px] text-fg-muted flex-1 leading-relaxed">
          <span className="font-semibold text-fg tabular">{EXAMPLE_TX.amount} XLM</span> confirmed into the
          escrow of the deployed contract —{" "}
          <a
            href={`https://stellar.expert/explorer/testnet/tx/${EXAMPLE_TX.hash}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-mono text-[12px] text-network hover:underline underline-offset-2"
          >
            {EXAMPLE_TX.hash.slice(0, 10)}…{EXAMPLE_TX.hash.slice(-6)}
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        </p>
        <span className="text-[11px] text-fg-faint shrink-0">Verify it yourself on Stellar Expert</span>
      </div>
    </div>
  );
}
