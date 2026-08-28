"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { MotionConfig } from "framer-motion";
import { Toaster } from "sonner";
import { useWalletStore } from "@/lib/store/walletStore";
import { useTheme } from "@/lib/theme";
import { SmoothScroll } from "@/components/smooth-scroll";

export function Providers({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const checkWallet = useWalletStore((state) => state.checkWallet);

  useEffect(() => {
    checkWallet();
  }, [checkWallet]);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Globally honor OS-level reduced-motion for every animation */}
      <MotionConfig reducedMotion="user">
        <SmoothScroll>{children}</SmoothScroll>
        <Toaster position="bottom-right" theme={theme} richColors closeButton />
      </MotionConfig>
    </QueryClientProvider>
  );
}
