"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { useTheme } from "@/lib/theme";

function isWebGLAvailable() {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

/** Catches WebGL/renderer failures and swaps in the static backdrop. */
class SceneErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.warn("Hero 3D scene unavailable, using static backdrop:", error);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

const StaticBackdrop = ({ className }: { className?: string }) => (
  <div className={className} aria-hidden="true">
    <div className="absolute inset-0 starfield opacity-60" />
  </div>
);

// Hoisted so the dynamic component keeps a stable identity across re-renders
// (an inline dynamic() call would remount the WebGL context on every render).
const Scene = dynamic(() => import("./hero-scene"), {
  ssr: false,
  loading: () => <StaticBackdrop className="absolute inset-0" />,
});

/**
 * Lazy, perf-aware wrapper around the WebGL hero scene.
 * - No SSR (WebGL is client-only)
 * - Reduced-motion, no-WebGL, and mobile users get the CSS-only backdrop:
 *   on phones the scrim covers most of the canvas, so WebGL buys little for
 *   the battery/heat it costs
 * - Weak desktop machines render a reduced-detail scene
 * - The render loop pauses while the hero is offscreen or the tab is hidden
 */
export function HeroVisual({ className }: { className?: string }) {
  const theme = useTheme();
  const [mode, setMode] = useState<"loading" | "static" | "low" | "high">("loading");
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !isWebGLAvailable() || window.innerWidth < 768) {
      setMode("static");
      return;
    }
    const cores = navigator.hardwareConcurrency ?? 8;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    setMode(cores <= 4 || memory <= 4 ? "low" : "high");
  }, []);

  useEffect(() => {
    if (mode !== "low" && mode !== "high") return;
    const el = wrapRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "120px" }
    );
    io.observe(el);

    const onVisibility = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [mode]);

  if (mode === "loading" || mode === "static") {
    return <StaticBackdrop className={className} />;
  }

  return (
    <div ref={wrapRef} className={className} aria-hidden="true">
      <div className="absolute inset-0 animate-fade-in">
        <SceneErrorBoundary fallback={<StaticBackdrop className="absolute inset-0" />}>
          <Scene detail={mode} active={inView && tabVisible} palette={theme} />
        </SceneErrorBoundary>
      </div>
    </div>
  );
}
