"use client";

import { useCallback, useEffect, useRef } from "react";
import { useInView, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

interface CountUpProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

/**
 * Number that counts up with a spring when scrolled into view, instead
 * of snapping. Funding data is the visual centerpiece of the product,
 * so every stat on a screen should arrive with motion.
 *
 * The real value is rendered in SSR markup (SEO + no-JS + reduced
 * motion); client-side the spring sweeps from zero once visible.
 */
export function CountUp({ value, decimals = 0, prefix = "", suffix = "", className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reducedMotion = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { damping: 64, stiffness: 82, mass: 0.85 });

  const format = useCallback(
    (n: number) =>
      `${prefix}${n.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}${suffix}`,
    [prefix, suffix, decimals]
  );

  useEffect(() => {
    if (!inView) return;
    if (reducedMotion) {
      motionValue.jump(value);
      return;
    }
    motionValue.set(value);
  }, [inView, value, reducedMotion, motionValue]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      if (ref.current) ref.current.textContent = format(latest);
    });
  }, [springValue, format]);

  return (
    <span ref={ref} className={className} aria-label={format(value)}>
      {format(value)}
    </span>
  );
}
