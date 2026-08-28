"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { PAGE_ANIMATE, PAGE_EXIT, PAGE_INITIAL, PAGE_TRANSITION } from "@/lib/motion";

/**
 * Consistent enter/exit motion between every route. Keyed by pathname so
 * each navigation plays the same fade + drift: the outgoing page settles
 * up and away while the incoming page rises into place.
 *
 * Query-string changes (marketplace filters) intentionally do not
 * re-key, so filtering never replays the page transition.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={PAGE_INITIAL}
        animate={PAGE_ANIMATE}
        exit={PAGE_EXIT}
        transition={PAGE_TRANSITION}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
