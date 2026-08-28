import Link from "next/link";
import Image from "next/image";
import { Github, Twitter, Globe } from "lucide-react";

const MARKETPLACE = [
  { label: "Technology & Hardware", href: "/campaigns?category=Technology" },
  { label: "Artificial Intelligence", href: "/campaigns?category=AI" },
  { label: "Web3 & Soroban DApps", href: "/campaigns?category=Web3" },
  { label: "Education & Literacy", href: "/campaigns?category=Education" },
  { label: "Gaming & Metaverse", href: "/campaigns?category=Gaming" },
];

const PLATFORM = [
  { label: "Launch a Campaign", href: "/campaigns/create" },
  { label: "Creator Dashboard", href: "/dashboard" },
  { label: "Supporter Refund Portal", href: "/supporter" },
  { label: "Explore Campaigns", href: "/campaigns" },
];

export function Footer() {
  const network = process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "TESTNET";
  const contractId = process.env.NEXT_PUBLIC_CROWDFUND_CONTRACT_ID;

  return (
    <footer className="mt-auto border-t border-line bg-bg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src="/logo.png"
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 rounded-md border border-line"
              />
              <span className="font-display text-lg font-semibold text-fg">
                CrowdFund<span className="text-accent">X</span>
              </span>
            </Link>
            <p className="text-[13px] leading-relaxed text-fg-muted max-w-xs">
              Launch. Fund. Build. A decentralized crowdfunding platform secured by Soroban smart-contract escrows on Stellar.
            </p>
          </div>

          {/* Marketplace */}
          <div className="md:col-span-3">
            <h4 className="text-[12px] font-semibold uppercase tracking-wider text-fg-faint font-mono">Marketplace</h4>
            <ul className="mt-4 space-y-2.5">
              {MARKETPLACE.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-[13px] text-fg-muted transition-colors hover:text-fg">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform */}
          <div className="md:col-span-3">
            <h4 className="text-[12px] font-semibold uppercase tracking-wider text-fg-faint font-mono">Platform</h4>
            <ul className="mt-4 space-y-2.5">
              {PLATFORM.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-[13px] text-fg-muted transition-colors hover:text-fg">
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href="https://developers.stellar.org/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[13px] text-fg-muted transition-colors hover:text-fg"
                >
                  Stellar Developer Docs
                </a>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div className="col-span-2 md:col-span-2">
            <h4 className="text-[12px] font-semibold uppercase tracking-wider text-fg-faint font-mono">Connect</h4>
            <div className="mt-4 flex items-center gap-2">
              {[
                { icon: Github, href: "https://github.com", label: "GitHub" },
                { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
                { icon: Globe, href: "https://stellar.org", label: "Stellar.org" },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-line bg-surface text-fg-muted transition-colors hover:text-fg hover:border-line-strong"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-line flex flex-col md:flex-row items-center justify-between gap-4 text-[12px] text-fg-faint">
          <p>© 2026 CrowdFundX. Powered by Stellar & Soroban. Built for Rise In Orange Belt Level 3.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {contractId && (
              <a
                href={`https://stellar.expert/explorer/${network.toLowerCase()}/contract/${contractId}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[11px] text-fg-muted transition-colors hover:text-network"
              >
                Escrow {contractId.slice(0, 8)}…{contractId.slice(-6)} ↗
              </a>
            )}
            <span
              className="flex items-center gap-1.5 rounded-full border border-success/25 bg-success/10 px-3 py-1.5 text-[11px] font-semibold text-success"
              role="status"
              aria-label={`Stellar ${network} network operational`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-dot" aria-hidden="true" />
              Stellar {network} · Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
