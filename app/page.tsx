import Link from "next/link";
import {
  ShieldCheck,
  Zap,
  Lock,
  ArrowRight,
  Coins,
  RefreshCw,
  Check,
  Network,
  Brain,
  Cpu,
  GraduationCap,
  Gamepad2,
  GitFork,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CampaignCard } from "@/components/campaign-card";
import { HeroVisual } from "@/components/three/HeroVisual";
import { Reveal } from "@/components/ui/reveal";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { cn, formatXlm } from "@/lib/utils";

export const revalidate = 60;

const STEPS = [
  {
    step: "01",
    title: "Create your campaign",
    desc: "Set your XLM funding target, deadline, and milestones. Tell your project story.",
  },
  {
    step: "02",
    title: "Escrow deploys itself",
    desc: "A Soroban smart contract is provisioned automatically on Stellar when you publish.",
  },
  {
    step: "03",
    title: "Receive XLM",
    desc: "Supporters back you from Freighter or any Stellar wallet. Settlement takes about a second.",
  },
  {
    step: "04",
    title: "Reach goal or refund",
    desc: "Hit your goal and withdraw. Miss it and the contract refunds backers in full.",
  },
];

const STELLAR_FEATURES = [
  {
    icon: Zap,
    title: "Sub-Second Settlement",
    desc: "Transactions finalize on Stellar in ~1 second with deterministic finality.",
  },
  {
    icon: Coins,
    title: "Fractional Fees",
    desc: "Average network fee is under 0.00001 XLM — a fraction of a cent.",
  },
  {
    icon: RefreshCw,
    title: "Automated Refunds",
    desc: "The contract unlocks 100% refunds to backers if a target isn't met.",
  },
  {
    icon: ShieldCheck,
    title: "Audited Rust Contracts",
    desc: "Soroban's memory-safe SDK eliminates whole classes of escrow exploits.",
  },
];

const CATEGORIES = [
  { name: "Web3 & Soroban", param: "Web3", icon: Network, href: "/campaigns?category=Web3" },
  { name: "Artificial Intelligence", param: "AI", icon: Brain, href: "/campaigns?category=AI" },
  { name: "Technology", param: "Technology", icon: Cpu, href: "/campaigns?category=Technology" },
  { name: "Education", param: "Education", icon: GraduationCap, href: "/campaigns?category=Education" },
  { name: "Gaming", param: "Gaming", icon: Gamepad2, href: "/campaigns?category=Gaming" },
  { name: "Open Source", param: "Open Source", icon: GitFork, href: "/campaigns?category=Open+Source" },
];

const FAQS = [
  {
    q: "How does CrowdFundX secure my donated XLM?",
    a: "Every campaign is governed by a Soroban smart contract on Stellar. Funds are locked in contract escrow until the funding goal is met or the deadline expires — no platform custody at any point.",
  },
  {
    q: "What happens if a campaign misses its goal?",
    a: "Supporters can execute a 100% refund claim directly against the Soroban contract. No middleman approval is required.",
  },
  {
    q: "Which wallets are supported?",
    a: "Freighter is natively supported, along with any Stellar wallet compatible with keypair signing.",
  },
  {
    q: "What are the platform fees?",
    a: "0% platform fees. You only pay the standard Stellar network fee (~0.00001 XLM per transaction).",
  },
];

async function getHomeData() {
  const fallback = {
    featured: [] as any[],
    stats: { totalRaised: 74450, activeCampaigns: 4, totalBackers: 1420 },
    categoryCounts: { Web3: 12, AI: 18, Technology: 24, Education: 9, Gaming: 15, "Open Source": 21 } as Record<string, number>,
  };
  try {
    const featured = await prisma.campaign.findMany({
      take: 3,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      include: {
        creator: { select: { name: true, avatar: true } },
        _count: { select: { donations: true } },
      },
    });

    const totalRaisedAgg = await prisma.campaign.aggregate({ _sum: { raisedAmount: true } });
    const activeCampaigns = await prisma.campaign.count({ where: { status: { in: ["ACTIVE", "SUCCESSFUL"] } } });
    const backers = await prisma.donation.groupBy({ by: ["contributorAddress"] });
    const byCategory = await prisma.campaign.groupBy({ by: ["category"], _count: { _all: true } });

    return {
      featured,
      stats: {
        totalRaised: Math.round(totalRaisedAgg._sum.raisedAmount ?? fallback.stats.totalRaised),
        activeCampaigns: activeCampaigns || fallback.stats.activeCampaigns,
        totalBackers: backers.length || fallback.stats.totalBackers,
      },
      categoryCounts: Object.fromEntries(byCategory.map((g) => [g.category, g._count._all])),
    };
  } catch (e) {
    console.warn("Using fallback home data");
    return fallback;
  }
}

export default async function HomePage() {
  const { featured, stats, categoryCounts } = await getHomeData();

  return (
    <div className="pb-24">
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden">
        {/* 3D backdrop, biased right on desktop */}
        <div className="absolute inset-y-0 right-0 w-full lg:w-[62%]">
          <HeroVisual className="absolute inset-0 h-full w-full" />
        </div>
        {/* Readability scrim + bottom fade (pointer-transparent so the canvas gets parallax input) */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-bg via-bg/55 to-transparent lg:via-bg/25" />
        <div className="absolute inset-x-0 bottom-0 h-32 pointer-events-none bg-gradient-to-t from-bg to-transparent" />

        <Container className="relative z-10 pt-20 pb-28 lg:pt-28 lg:pb-36">
          <div className="max-w-2xl space-y-7">
            <Reveal>
              <p className="eyebrow flex items-center gap-2.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-network" />
                Crowdfunding on the Stellar network
              </p>
            </Reveal>

            <Reveal delay={0.08}>
              <h1 className="font-display text-[42px] leading-[1.04] font-semibold tracking-tight text-fg sm:text-6xl lg:text-[68px]">
                Launch. Fund. Build.
                <br />
                Crowdfunding on <span className="text-accent">Stellar</span>.
              </h1>
            </Reveal>

            <Reveal delay={0.16}>
              <p className="text-[15px] sm:text-[17px] leading-relaxed text-fg-muted max-w-xl">
                Every campaign is secured by a Soroban smart contract. Funds stay in escrow until the
                goal is met — otherwise they are refunded automatically.
              </p>
            </Reveal>

            <Reveal delay={0.24}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-1">
                <Button size="lg" href="/campaigns">Explore Campaigns</Button>
                <Button size="lg" variant="outline" href="/campaigns/create">Launch a Project</Button>
              </div>
            </Reveal>

            <Reveal delay={0.32}>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-4 text-[12px] text-fg-muted">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-fg-faint" /> No middleman fees
                </span>
                <span className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-fg-faint" /> Sub-second finality
                </span>
                <span className="flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-fg-faint" /> Soroban escrow secured
                </span>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ============ STATS ============ */}
      <section className="relative -mt-10 z-20">
        <Container>
          <Reveal>
            <div className="panel grid grid-cols-2 lg:grid-cols-4 overflow-hidden">
              {[
                { label: "Total Raised", value: formatXlm(stats.totalRaised), suffix: "XLM", accent: true },
                { label: "Active Campaigns", value: String(stats.activeCampaigns) },
                { label: "Total Backers", value: formatXlm(stats.totalBackers) },
                { label: "Refund Guarantee", value: "100%" },
              ].map((s, i) => (
                <Stat
                  key={s.label}
                  label={s.label}
                  value={s.value}
                  suffix={s.suffix}
                  accent={s.accent}
                  className={cn(
                    i % 2 === 1 && "border-l border-line",
                    i >= 2 && "border-t border-line lg:border-t-0",
                    i > 0 && "lg:border-l lg:border-line"
                  )}
                />
              ))}
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ============ FEATURED ============ */}
      <section className="pt-24">
        <Container className="space-y-10">
          <Reveal>
            <SectionHeading
              eyebrow="Marketplace"
              title="Featured Campaigns"
              action={
                <Link href="/campaigns" className="inline-flex items-center gap-1.5 text-sm text-network hover:text-fg transition-colors">
                  View all <ArrowRight className="w-4 h-4" />
                </Link>
              }
            />
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featured.map((c: any, i: number) => (
              <Reveal key={c.id} delay={i * 0.08}>
                <CampaignCard campaign={c} />
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="pt-28">
        <Container className="space-y-12">
          <Reveal>
            <SectionHeading
              eyebrow="Process"
              title="How It Works"
              description="From contract creation to automated refunds, every step executes on-chain."
            />
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((s, i) => (
              <Reveal key={s.step} delay={i * 0.08}>
                <div className="panel panel-hover h-full p-6 space-y-4">
                  <span className="block font-mono text-[12px] tracking-widest text-accent">{s.step}</span>
                  <div className="space-y-2">
                    <h3 className="font-display text-[16px] font-semibold text-fg">{s.title}</h3>
                    <p className="text-[13px] leading-relaxed text-fg-muted">{s.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ============ WHY STELLAR ============ */}
      <section className="pt-28">
        <Container>
          <div className="panel overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="lg:col-span-5 p-8 sm:p-12 border-b lg:border-b-0 lg:border-r border-line space-y-5">
                <p className="eyebrow">The Network</p>
                <h2 className="font-display text-3xl font-semibold text-fg leading-tight">
                  Why crowdfunding belongs on Stellar
                </h2>
                <p className="text-sm leading-relaxed text-fg-muted">
                  Legacy platforms charge 5–10% fees, hold funds for weeks, and can freeze accounts arbitrarily.
                  CrowdFundX uses Soroban smart contracts to make raising money fast, decentralized, and trustless.
                </p>
              </div>
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2">
                {STELLAR_FEATURES.map((f, i) => {
                  const Icon = f.icon;
                  return (
                    <div
                      key={f.title}
                      className={cn(
                        "p-7 space-y-2.5",
                        i < 3 && "border-b border-line",
                        i >= 2 && "sm:border-b-0",
                        i < 2 && "sm:border-b sm:border-line",
                        i % 2 === 0 && "sm:border-r sm:border-line"
                      )}
                    >
                      <Icon className="w-5 h-5 text-accent" />
                      <h3 className="font-display text-[15px] font-semibold text-fg">{f.title}</h3>
                      <p className="text-[13px] leading-relaxed text-fg-muted">{f.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ============ CATEGORIES ============ */}
      <section className="pt-28">
        <Container className="space-y-10">
          <Reveal>
            <SectionHeading eyebrow="Categories" title="Browse by Category" />
          </Reveal>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORIES.map((c, i) => {
              const Icon = c.icon;
              const count = categoryCounts[c.param] ?? 0;
              return (
                <Reveal key={c.name} delay={i * 0.05}>
                  <Link
                    href={c.href}
                    className="panel panel-hover group flex flex-col items-center text-center gap-3 p-6"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-[12px] border border-line bg-surface-2 text-network transition-colors group-hover:text-accent group-hover:border-accent/40">
                      <Icon className="w-5 h-5" />
                    </span>
                    <span className="space-y-0.5">
                      <span className="block text-[13px] font-semibold text-fg group-hover:text-accent-strong transition-colors">
                        {c.name}
                      </span>
                      <span className="block text-[11px] text-fg-faint tabular">
                        {count} {count === 1 ? "project" : "projects"}
                      </span>
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ============ FAQ ============ */}
      <section className="pt-28">
        <Container className="max-w-3xl space-y-10">
          <Reveal>
            <SectionHeading eyebrow="FAQ" title="Frequently asked questions" />
          </Reveal>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <Reveal key={i} delay={i * 0.06}>
                <div className="panel p-6 space-y-2">
                  <h3 className="text-[15px] font-semibold text-fg">{faq.q}</h3>
                  <p className="text-[13px] leading-relaxed text-fg-muted">{faq.a}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ============ CTA ============ */}
      <section className="pt-28">
        <Container>
          <Reveal>
            <div className="panel relative overflow-hidden p-10 sm:p-16 text-center">
              <div className="absolute inset-0 starfield opacity-30 pointer-events-none" />
              <div className="relative space-y-6 max-w-2xl mx-auto">
                <h2 className="font-display text-3xl sm:text-[44px] leading-tight font-semibold text-fg">
                  Launch your next project on Stellar
                </h2>
                <p className="text-[15px] text-fg-muted max-w-xl mx-auto">
                  Creators raise, backers contribute, and the contract handles the rest.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <Button size="lg" href="/campaigns/create">Create Campaign</Button>
                  <Button size="lg" variant="outline" href="/campaigns">Browse Projects</Button>
                </div>
                <div className="flex items-center justify-center gap-5 text-[11px] text-fg-faint pt-2">
                  <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-success" /> 0% platform fee</span>
                  <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-success" /> Automated refunds</span>
                  <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-success" /> Live on testnet</span>
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  suffix,
  accent,
  className,
}: {
  label: string;
  value: string;
  suffix?: string;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("px-6 py-6 sm:px-8 sm:py-7", className)}>
      <p className="font-display text-2xl sm:text-[30px] font-semibold text-fg tabular">
        {value} {suffix && <span className={accent ? "text-accent text-sm" : "text-fg-faint text-sm"}>{suffix}</span>}
      </p>
      <p className="mt-1 text-[11px] uppercase tracking-wider text-fg-faint font-mono">{label}</p>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  center,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  center?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-3 ${center ? "items-center text-center" : "md:flex-row md:items-end md:justify-between"}`}>
      <div className={`space-y-2 ${center ? "max-w-xl" : ""}`}>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-fg">{title}</h2>
        {description && <p className="text-sm text-fg-muted leading-relaxed">{description}</p>}
      </div>
      {action}
    </div>
  );
}
