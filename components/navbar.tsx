"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWalletStore } from "@/lib/store/walletStore";
import {
  Wallet,
  Rocket,
  Compass,
  LayoutDashboard,
  HeartHandshake,
  Bell,
  LogOut,
  ChevronDown,
  ExternalLink,
  Menu,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn, shortAddress, formatXlm } from "@/lib/utils";

const NAV_LINKS = [
  { name: "Explore", href: "/campaigns", icon: Compass },
  { name: "Create", href: "/campaigns/create", icon: Rocket },
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Supporter", href: "/supporter", icon: HeartHandshake },
];

/** Orbital brand mark — a star with a single orbiting body. */
function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="5.5" fill="currentColor" opacity="0.95" />
      <ellipse cx="16" cy="16" rx="13" ry="6" stroke="currentColor" strokeWidth="1.4" opacity="0.45" />
      <circle cx="27.5" cy="12" r="1.8" fill="currentColor" />
    </svg>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { isConnected, publicKey, balance, connect, disconnect, hasFreighter } = useWalletStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isConnected) {
      fetch("/api/notifications")
        .then((res) => res.json())
        .then((data) => setNotifications(data.notifications || []))
        .catch(() => {});
    }
  }, [isConnected]);

  // Close menus on route change
  useEffect(() => {
    setShowDropdown(false);
    setShowNotifications(false);
    setMobileOpen(false);
  }, [pathname]);

  // Click-outside closes dropdowns
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleConnect = async () => {
    if (!hasFreighter) {
      toast.error("Freighter Wallet not detected", {
        description: "Please install the Freighter Browser Extension to interact with Soroban on Stellar.",
        action: {
          label: "Install Freighter",
          onClick: () => window.open("https://www.freighter.app/", "_blank"),
        },
      });
      return;
    }

    toast.loading("Connecting Freighter Wallet...", { id: "connect-wallet" });
    const walletKey = await connect();
    if (walletKey) {
      toast.success("Wallet Connected!", {
        id: "connect-wallet",
        description: `Authenticated on Stellar Testnet as ${walletKey.substring(0, 6)}...${walletKey.substring(walletKey.length - 4)}`,
      });
    } else {
      toast.error("Connection Failed", {
        id: "connect-wallet",
        description: "Could not connect or retrieve account from Freighter wallet.",
      });
    }
  };

  const unread = notifications.some((n) => !n.read);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-line bg-bg/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0" aria-label="CrowdFundX home">
          <span className="text-accent group-hover:text-accent-strong transition-colors">
            <LogoMark className="w-7 h-7" />
          </span>
          <span className="font-display text-[19px] font-semibold tracking-tight text-fg">
            CrowdFund<span className="text-accent">X</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Primary">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3.5 py-2 rounded-[10px] text-[13.5px] font-medium transition-colors",
                  isActive ? "text-fg bg-surface-2" : "text-fg-muted hover:text-fg hover:bg-surface"
                )}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Right cluster */}
        <div className="flex items-center gap-2.5" ref={dropdownRef}>
          {isConnected && (
            <div className="relative hidden sm:block">
              <button
                onClick={() => {
                  setShowNotifications((v) => !v);
                  setShowDropdown(false);
                }}
                className="relative flex h-10 w-10 items-center justify-center rounded-[10px] border border-line bg-surface text-fg-muted transition-colors hover:text-fg hover:border-line-strong"
                aria-label="Notifications"
              >
                <Bell className="w-[18px] h-[18px]" />
                {unread && <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-accent animate-pulse-dot" />}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.16 }}
                    className="absolute right-0 mt-2 w-80 panel bg-surface shadow-2xl shadow-black/50 p-4"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-line mb-3">
                      <h4 className="text-sm font-semibold text-fg">Notifications</h4>
                      <span className="text-[11px] text-fg-faint tabular">{notifications.length}</span>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1" data-lenis-prevent>
                      {notifications.length === 0 ? (
                        <p className="text-xs text-fg-faint text-center py-6">No recent notifications</p>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} className="rounded-[10px] border border-line bg-surface-2/60 p-3">
                            <p className="text-xs text-fg leading-relaxed">{n.message}</p>
                            <span className="mt-1.5 block text-[10px] text-fg-faint">
                              {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {!isConnected ? (
            <button
              onClick={handleConnect}
              className="hidden sm:inline-flex items-center gap-2 rounded-[11px] bg-accent px-4 h-10 text-sm font-semibold text-fg-on-accent transition-all hover:bg-accent-strong shadow-[0_8px_24px_-8px_rgba(255,106,26,0.5)]"
            >
              <Wallet className="w-4 h-4" />
              Connect Wallet
            </button>
          ) : (
            <div className="relative hidden sm:block">
              <button
                onClick={() => {
                  setShowDropdown((v) => !v);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-3 rounded-[11px] border border-line bg-surface px-3 h-10 transition-colors hover:border-line-strong"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 text-accent-strong text-[10px] font-bold">
                  XLM
                </span>
                <span className="flex flex-col items-start leading-none">
                  <span className="text-[12px] font-semibold text-fg tabular">{shortAddress(publicKey)}</span>
                  <span className="mt-1 text-[10px] text-network tabular">{formatXlm(balance)} XLM</span>
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-fg-faint" />
              </button>

              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.16 }}
                    className="absolute right-0 mt-2 w-72 panel bg-surface shadow-2xl shadow-black/50 p-2"
                  >
                    <div className="px-3 py-3 border-b border-line mb-2">
                      <p className="text-[10px] uppercase tracking-wider text-fg-faint font-mono">Stellar Account</p>
                      <p className="mt-1.5 break-all font-mono text-[11px] text-fg leading-relaxed">{publicKey}</p>
                    </div>

                    <MenuItem href="/dashboard" icon={<LayoutDashboard className="w-4 h-4 text-accent" />}>
                      Creator Dashboard
                    </MenuItem>
                    <MenuItem href="/supporter" icon={<HeartHandshake className="w-4 h-4 text-network" />}>
                      Supporter Portal & Refunds
                    </MenuItem>
                    <a
                      href={`https://stellar.expert/explorer/testnet/account/${publicKey}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 rounded-[9px] px-3 py-2.5 text-[13px] text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
                    >
                      <ExternalLink className="w-4 h-4 text-network" />
                      Stellar Expert Explorer
                    </a>

                    <div className="my-1.5 border-t border-line" />
                    <button
                      onClick={() => {
                        disconnect();
                        setShowDropdown(false);
                        toast.info("Wallet Disconnected");
                      }}
                      className="w-full flex items-center gap-2.5 rounded-[9px] px-3 py-2.5 text-[13px] text-danger transition-colors hover:bg-danger/10"
                    >
                      <LogOut className="w-4 h-4" />
                      Disconnect Wallet
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Mobile menu trigger */}
          <button
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-[10px] border border-line bg-surface text-fg"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden overflow-hidden border-t border-line bg-bg/95 backdrop-blur-md"
          >
            <div className="px-4 py-4 space-y-1">
              {NAV_LINKS.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 rounded-[10px] px-3 py-3 text-sm font-medium transition-colors",
                      isActive ? "bg-surface-2 text-fg" : "text-fg-muted hover:bg-surface hover:text-fg"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {link.name}
                  </Link>
                );
              })}

              <div className="pt-3 border-t border-line mt-3">
                {!isConnected ? (
                  <button
                    onClick={handleConnect}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-[11px] bg-accent px-4 h-11 text-sm font-semibold text-fg-on-accent"
                  >
                    <Wallet className="w-4 h-4" />
                    Connect Wallet
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="rounded-[10px] border border-line bg-surface px-3 py-2.5">
                      <p className="text-[12px] font-semibold text-fg tabular">{shortAddress(publicKey)}</p>
                      <p className="text-[10px] text-network tabular">{formatXlm(balance)} XLM</p>
                    </div>
                    <button
                      onClick={() => {
                        disconnect();
                        setMobileOpen(false);
                        toast.info("Wallet Disconnected");
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-[11px] border border-danger/30 bg-danger/10 px-4 h-10 text-sm font-medium text-danger"
                    >
                      <LogOut className="w-4 h-4" />
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function MenuItem({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-[9px] px-3 py-2.5 text-[13px] text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
    >
      {icon}
      {children}
    </Link>
  );
}
