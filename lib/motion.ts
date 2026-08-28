import type { Transition, Variants } from "framer-motion";

/**
 * Central motion system. Every animated surface in the app pulls its
 * easing, durations, variants, and springs from here so the product
 * moves with one consistent voice. Never hand-roll an easing elsewhere.
 */

/** Signature ease-out curve — swift launch, long controlled settle. */
export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Symmetric ease for enter/exit pairs and hovers. */
export const EASE_IN_OUT: [number, number, number, number] = [0.65, 0, 0.35, 1];

export const DUR = {
  fast: 0.18,
  base: 0.32,
  slow: 0.6,
  crawl: 0.9,
} as const;

/** Snappy interaction spring (cards, dropdowns). */
export const SPRING: Transition = { type: "spring", stiffness: 340, damping: 28, mass: 0.9 };

/** Softer spring for larger surfaces (modals, panels). */
export const SPRING_SOFT: Transition = { type: "spring", stiffness: 230, damping: 26 };

export const VIEWPORT = { once: true, margin: "-80px" } as const;

/* ------------------------------------------------------------------ */
/* Variants                                                            */
/* ------------------------------------------------------------------ */

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: DUR.slow, ease: EASE } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: DUR.base, ease: EASE } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: DUR.base, ease: EASE } },
};

/** Parent container that staggers its variant-driven children. */
export function stagger(delayChildren = 0, staggerChildren = 0.08): Variants {
  return {
    hidden: {},
    show: { transition: { staggerChildren: staggerChildren, delayChildren } },
  };
}

/* ------------------------------------------------------------------ */
/* Route transitions                                                   */
/* ------------------------------------------------------------------ */

export const PAGE_INITIAL = { opacity: 0, y: 14 };
export const PAGE_ANIMATE = { opacity: 1, y: 0 };
export const PAGE_EXIT = { opacity: 0, y: -10 };
export const PAGE_TRANSITION: Transition = { duration: DUR.base, ease: EASE };
