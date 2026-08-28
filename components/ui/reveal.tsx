"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { DUR, EASE, VIEWPORT, fadeUp } from "@/lib/motion";

/**
 * Scroll-triggered entrance. Server components can wrap content in this
 * to get consistent reveal motion without becoming client components.
 * Timing and easing come from the central motion system.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      transition={{ duration: DUR.slow, delay, ease: EASE }}
      variants={fadeUp}
    >
      {children}
    </motion.div>
  );
}
