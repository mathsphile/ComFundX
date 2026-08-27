import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes with conflict resolution.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Compact a Stellar wallet address for display: GABC…XYZ
 */
export function shortAddress(address?: string | null, lead = 6, tail = 4) {
  if (!address) return "";
  if (address.length <= lead + tail + 1) return address;
  return `${address.slice(0, lead)}…${address.slice(-tail)}`;
}

/**
 * Format an XLM amount with grouped thousands.
 */
export function formatXlm(value: number, fractionDigits = 0) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  });
}

/**
 * Whole days remaining until a deadline (floored at 0).
 */
export function daysUntil(deadline: string | Date) {
  const target = new Date(deadline).getTime();
  const diff = target - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
