"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import { useWalletStore } from "@/lib/store/walletStore";
import { SmoothScroll } from "@/components/smooth-scroll";

export function Providers({ children }: { children: React.ReactNode }) {
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
      <SmoothScroll>{children}</SmoothScroll>
      <Toaster position="bottom-right" theme="dark" richColors closeButton />
    </QueryClientProvider>
  );
}
