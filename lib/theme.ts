"use client";

import { useSyncExternalStore } from "react";

export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "cfx-theme";
export const THEME_CHANGE_EVENT = "cfx-theme-change";

/**
 * Inline bootstrap script for <body> in the root layout. Runs before
 * hydration so the correct theme is applied with no flash. Honors a
 * ?theme=light|dark override (handy for previews), then localStorage,
 * then the OS preference, then the product default (light).
 */
export const themeInitScript = `(function(){try{var p=new URLSearchParams(window.location.search);var t=p.get("theme");if(t!=="light"&&t!=="dark"){t=localStorage.getItem("${THEME_STORAGE_KEY}")}if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-theme",t)}catch(e){document.documentElement.setAttribute("data-theme","light")}})();`;

export function getTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

export function setTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* private mode — session-only preference */
  }
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, onChange);
}

/** Reactive current theme. Re-renders subscribers when it toggles. */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, getTheme, () => "light");
}
