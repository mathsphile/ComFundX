"use client";

import { useEffect, useRef } from "react";
import { getTheme, THEME_CHANGE_EVENT } from "@/lib/theme";

/**
 * Featherweight ambient drift field (2D canvas, not WebGL). Gives
 * content headers a sense of depth without the cost of a full 3D
 * scene — dashboards, forms and detail pages must stay performant.
 * Pauses when offscreen or the tab is hidden; reduced-motion users
 * get a single static frame instead of drift. Particle color follows
 * the active color theme.
 */
export function AmbientField({ className, count = 70 }: { className?: string; count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let frame = 0;
    let running = true;
    let dark = getTheme() === "dark";
    const onThemeChange = () => {
      dark = getTheme() === "dark";
    };
    window.addEventListener(THEME_CHANGE_EVENT, onThemeChange);

    const stars = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.3 + 0.3,
      speed: Math.random() * 0.012 + 0.004,
      phase: Math.random() * Math.PI * 2,
    }));

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, width * dpr);
      canvas.height = Math.max(1, height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = (now: number) => {
      ctx.clearRect(0, 0, width, height);
      const rgb = dark ? "190, 205, 235" : "60, 76, 112";
      for (const s of stars) {
        const twinkle = 0.3 + 0.4 * (0.5 + 0.5 * Math.sin(now / 1400 + s.phase));
        ctx.beginPath();
        ctx.arc(s.x * width, s.y * height, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb}, ${twinkle})`;
        ctx.fill();
      }
    };

    const tick = (now: number) => {
      if (!running) return;
      for (const s of stars) {
        s.y -= s.speed * 0.016;
        if (s.y < -0.02) {
          s.y = 1.02;
          s.x = Math.random();
        }
      }
      draw(now);
      frame = requestAnimationFrame(tick);
    };

    if (reduced) {
      draw(performance.now());
      return () => {
        ro.disconnect();
        window.removeEventListener(THEME_CHANGE_EVENT, onThemeChange);
      };
    }

    const start = () => {
      if (running) return;
      running = true;
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };

    const io = new IntersectionObserver(([entry]) => {
      entry.isIntersecting ? start() : stop();
    });
    io.observe(canvas);

    const onVisibility = () => {
      document.visibilityState === "visible" ? start() : stop();
    };
    document.addEventListener("visibilitychange", onVisibility);

    frame = requestAnimationFrame(tick);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener(THEME_CHANGE_EVENT, onThemeChange);
    };
  }, [count]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
