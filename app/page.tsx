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
  Quote,
  Banknote,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CampaignCard } from "@/components/campaign-card";
import { HeroVisual } from "@/components/three/HeroVisual";
import { Reveal } from "@/components/ui/reveal";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/ui/count-up";
import { Avatar } from "@/components/ui/avatar";
import { HowItWorksFlow } from "@/components/home/how-it-works";
import { ExperiencePaths } from "@/components/home/paths";
import { TransactionFlow } from "@/components/home/transaction-flow";
import { Faq } from "@/components/home/faq";
import { cn } from "@/lib/utils";

export const revalidate = 60;

const STELLAR_FEATURES = [
  {
    icon: Zap,
    title: "Five-Second Settlement",
    desc: "Stellar ledgers close roughly every five seconds with deterministic finality.",
  },
  {
    icon: Coins,
    title: "Fractional Fees",
    desc: "The network fee per transaction is a tiny fraction of a cent.",
  },
  {
    icon: RefreshCw,
    title: "Automated Refunds",
    desc: "Missed the goal? The contract returns 100% of every contribution.",
  },
  {
    icon: ShieldCheck,
    title: "Auditable Rust Contracts",
    desc: "Soroban's memory-safe SDK and 18 passing unit tests back the escrow logic.",
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
      {/* ============ 01 · HERO ============ */}
      <section className="relative overflow-hidden">
        {/* Sky-blue atmospheric wash — hero only, per design.md */}
        <div className="absolute inset-0 hero-wash pointer-events-none" aria-hidden="true" />
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
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-fg" />
                Crowdfunding on the Stellar network
              </p>
            </Reveal>

            <Reveal delay={0.08}>
              <h1 className="font-display text-[40px] leading-[1.05] font-semibold tracking-[-0.03em] text-fg sm:text-[52px] lg:text-[64px]">
                Fund ideas. Back innovation. Build the future.
              </h1>
            </Reveal>

            <Reveal delay={0.16}>
              <p className="text-base leading-[1.5] text-fg-muted max-w-xl">
                Every campaign is held in a Soroban smart-contract escrow. Reach the goal and the creator
                is paid. Miss it and every contributor is refunded — automatically, on-chain.
              </p>
            </Reveal>

            <Reveal delay={0.24}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-1">
                <Button size="lg" href="/campaigns">Explore Campaigns</Button>
                <Button size="lg" variant="secondary" href="/campaigns/create">Start a Campaign</Button>
                <Button size="lg" variant="ghost" href="#how-it-works" icon={<ArrowRight className="w-4 h-4" />} iconPosition="right">
                  See how it works
                </Button>
              </div>
            </Reveal>

            <Reveal delay={0.32}>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-4 text-[12px] text-fg-muted">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-fg-faint" /> Soroban escrow secured
                </span>
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4 text-fg-faint" /> 100% automated refunds
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-fg-faint" /> 0% platform fee
                </span>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ============ 02 · STATS ============ */}
      <section className="relative -mt-10 z-20">
        <Container>
          <Reveal>
            <div className="panel grid grid-cols-2 lg:grid-cols-4 overflow-hidden">
              {[
                { label: "Total Raised", value: stats.totalRaised, suffix: "XLM" },
                { label: "Active Campaigns", value: stats.activeCampaigns },
                { label: "Total Backers", value: stats.totalBackers },
                { label: "Refund Guarantee", value: "100%" },
              ].map((s, i) => (
                <Stat
                  key={s.label}
                  label={s.label}
                  value={s.value}
                  suffix={s.suffix}
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

      {/* ============ 03 · PRODUCT INTRODUCTION ============ */}
      <section className="pt-24">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <Reveal className="space-y-6">
              <p className="eyebrow">What FundX is</p>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-[-0.02em] text-fg leading-[1.15]">
                Crowdfunding, rebuilt for an open financial network.
              </h2>
              <p className="text-[15px] leading-relaxed text-fg-muted max-w-lg">
                Traditional platforms hold your money, take a cut, and decide the outcome. FundX replaces
                that middleman with a contract on Stellar: contributions go straight into escrow, and the
                rules are enforced by code that anyone can read and every transaction can be verified.
              </p>
              <ul className="space-y-3.5 pt-1">
                {[
                  { icon: Lock, text: "Funds sit in a Soroban escrow — never in a platform account." },
                  { icon: RefreshCw, text: "All-or-nothing: goal met means payout, deadline missed means full refunds." },
                  { icon: Network, text: "Every contribution lands on the Stellar ledger with a public transaction hash." },
                ].map((item) => (
                  <li key={item.text} className="flex items-start gap-3 text-sm text-fg-muted leading-relaxed">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-surface-2">
                      <item.icon className="h-3.5 w-3.5 text-fg" aria-hidden="true" />
                    </span>
                    {item.text}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.1}>
              {featured[0] ? (
                <div className="max-w-md mx-auto lg:ml-auto">
                  <CampaignCard campaign={featured[0]} />
                </div>
              ) : (
                <div className="panel p-10 text-center space-y-3 max-w-md mx-auto lg:ml-auto">
                  <p className="text-sm font-semibold text-fg">No live campaigns yet</p>
                  <p className="text-[13px] text-fg-muted">Be the first creator to launch on FundX.</p>
                  <Button variant="secondary" size="sm" href="/campaigns/create">Start a Campaign</Button>
                </div>
              )}
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ============ 04 · HOW IT WORKS ============ */}
      <section id="how-it-works" className="pt-24 scroll-mt-20">
        <Container className="space-y-12">
          <Reveal>
            <SectionHeading
              eyebrow="The flow"
              title="How FundX works"
              description="From discovery to payout, every step is a normal Stellar transaction."
            />
          </Reveal>
          <HowItWorksFlow />
        </Container>
      </section>

      {/* ============ 05 · CREATOR / BACKER PATHS ============ */}
      <section className="pt-24">
        <Container className="space-y-10">
          <Reveal>
            <SectionHeading
              eyebrow="Two experiences"
              title="Two sides of the same escrow"
              description="Whether you're raising or backing, the contract treats both sides symmetrically."
            />
          </Reveal>
          <Reveal delay={0.08}>
            <ExperiencePaths />
          </Reveal>
        </Container>
      </section>

      {/* ============ 06 · DISCOVERY / FEATURED ============ */}
      <section className="pt-24">
        <Container className="space-y-10">
          <Reveal>
            <SectionHeading
              eyebrow="Marketplace"
              title="Featured campaigns"
              action={
                <Link href="/campaigns" className="inline-flex items-center gap-1.5 text-sm text-network hover:text-fg transition-colors">
                  View all <ArrowRight className="w-4 h-4" />
                </Link>
              }
            />
          </Reveal>

          {/* Category navigation */}
          <Reveal delay={0.05}>
            <div className="flex flex-wrap items-center gap-2">
              {CATEGORIES.map((c) => {
                const count = categoryCounts[c.param] ?? 0;
                return (
                  <Link
                    key={c.param}
                    href={c.href}
                    className="inline-flex items-center gap-2 rounded-full bg-surface-2 px-3.5 py-2 text-[12px] font-semibold text-fg-muted transition-colors hover:bg-surface-3 hover:text-fg"
                  >
                    <c.icon className="h-3.5 w-3.5" aria-hidden="true" />
                    {c.name}
                    <span className="font-mono text-[11px] text-fg-faint tabular">{count}</span>
                  </Link>
                );
              })}
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featured.map((c: any, i: number) => (
              <Reveal key={c.id} delay={i * 0.08}>
                <CampaignCard campaign={c} />
              </Reveal>
            ))}
            {featured.length === 0 && (
              <div className="md:col-span-3 panel p-10 text-center space-y-3">
                <p className="text-sm font-semibold text-fg">No campaigns live right now</p>
                <p className="text-[13px] text-fg-muted">Launch yours and it will appear here instantly.</p>
              </div>
            )}
          </div>
        </Container>
      </section>

      {/* ============ 07 · ON-CHAIN TRANSACTION FLOW ============ */}
      <section className="pt-24">
        <Container className="space-y-10">
          <Reveal>
            <SectionHeading
              eyebrow="On the record"
              title="Every contribution is on the record"
              description="A contribution isn't a database row — it's a Stellar transaction with a public hash."
            />
          </Reveal>
          <Reveal delay={0.08}>
            <TransactionFlow />
          </Reveal>
        </Container>
      </section>

      {/* ============ 08 · FOLLOW THE MONEY ============ */}
      <section className="pt-24">
        <Container className="space-y-10">
          <Reveal>
            <SectionHeading
              eyebrow="Follow the money"
              title="Exactly what happens to your XLM"
              description="Two possible outcomes, both enforced by the contract. No discretion, no exceptions."
            />
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Reveal>
              <div className="panel h-full p-7 space-y-5 border-success/30">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-semibold text-fg">Goal reached</h3>
                  <span className="rounded-full bg-success/10 border border-success/25 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-success">
                    Payout
                  </span>
                </div>
                <EscrowTrack
                  nodes={["Contributions", "Contract escrow", "Creator withdraws"]}
                  tone="success"
                />
                <p className="text-[13px] leading-relaxed text-fg-muted">
                  Once raised ≥ goal, the creator withdraws the full amount in one transaction. Withdrawal
                  is creator-only and one-shot — the contract refuses repeats.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="panel h-full p-7 space-y-5 border-warning/30">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-semibold text-fg">Deadline missed</h3>
                  <span className="rounded-full bg-warning/10 border border-warning/25 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-warning">
                    Refunds
                  </span>
                </div>
                <EscrowTrack
                  nodes={["Contributions", "Contract escrow", "100% refunded"]}
                  tone="warning"
                />
                <p className="text-[13px] leading-relaxed text-fg-muted">
                  After the deadline, every contributor can claim back exactly what they gave. No approval
                  step, no waiting on the platform — the contract pays directly.
                </p>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.12}>
            <p className="flex items-center justify-center gap-2 text-[13px] text-fg-muted">
              <Banknote className="h-4 w-4 text-fg-faint" aria-hidden="true" />
              The contract is the only custodian. FundX never holds campaign funds.
            </p>
          </Reveal>
        </Container>
      </section>

      {/* ============ 09 · WHY STELLAR ============ */}
      <section className="pt-24">
        <Container>
          <Reveal>
            <div className="panel-dark overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-12">
                <div className="lg:col-span-5 p-8 sm:p-12 border-b lg:border-b-0 lg:border-r border-white/10 space-y-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#b0b4ba]">The Network</p>
                  <h2 className="font-display text-3xl font-semibold text-white leading-tight tracking-[-0.02em]">
                    Why crowdfunding belongs on Stellar
                  </h2>
                  <p className="text-sm leading-relaxed text-[#b0b4ba]">
                    Legacy platforms charge 5–10% fees, hold funds for weeks, and can freeze accounts arbitrarily.
                    FundX uses Soroban smart contracts to make raising money fast, decentralized, and trustless.
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
                          i < 3 && "border-b border-white/10",
                          i >= 2 && "sm:border-b-0",
                          i < 2 && "sm:border-b sm:border-white/10",
                          i % 2 === 0 && "sm:border-r sm:border-white/10"
                        )}
                      >
                        <Icon className="w-5 h-5 text-[#47c2ff]" />
                        <h3 className="font-display text-[15px] font-semibold text-white">{f.title}</h3>
                        <p className="text-[13px] leading-relaxed text-[#b0b4ba]">{f.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ============ 10 · STORY ============ */}
      <section className="pt-24">
        <Container>
          <Reveal>
            <div className="max-w-3xl mx-auto text-center space-y-6 py-8">
              <p className="eyebrow">Why we built this</p>
              <h2 className="font-display text-3xl sm:text-[40px] leading-[1.15] font-semibold tracking-[-0.02em] text-fg">
                Ideas deserve a fair shot.
              </h2>
              <p className="text-[15px] leading-relaxed text-fg-muted max-w-2xl mx-auto">
                A creator shouldn't need a platform's permission to get paid, and a backer shouldn't have
                to trust a company with their money. FundX exists so the only things deciding a campaign's
                outcome are the goal, the deadline, and the people who back it.
              </p>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ============ 11 · TRUST LEDGER ============ */}
      <section className="pt-24">
        <Container className="space-y-10">
          <Reveal>
            <SectionHeading
              eyebrow="Trust Ledger"
              title="Verified in public, backed by proof"
              description="Every claim about this platform is checkable — on the Stellar ledger, in the test suite, or in the repo."
            />
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Verified testimonial */}
            <Reveal className="lg:col-span-5 h-full">
              <figure className="panel h-full p-8 flex flex-col justify-between gap-10">
                <blockquote className="space-y-5">
                  <Quote className="w-7 h-7 text-fg" aria-hidden="true" />
                  <p className="font-display text-[17px] leading-relaxed text-fg">
                    “Connected Freighter in seconds on Testnet. The UI is clean, and wallet-based user
                    identity works seamlessly — no email sign-ups.”
                  </p>
                </blockquote>
                <figcaption className="flex items-center gap-3">
                  <Avatar name="Indrajit Ari" size={38} />
                  <div>
                    <p className="text-[13px] font-semibold text-fg">Indrajit Ari</p>
                    <p className="text-[11px] text-fg-faint font-mono">GD3KR7…JX7M · Testnet tester</p>
                  </div>
                </figcaption>
              </figure>
            </Reveal>

            {/* Animated trust counters */}
            <Reveal delay={0.08} className="lg:col-span-7 h-full">
              <div className="panel h-full overflow-hidden">
                <div className="grid h-full grid-cols-2 sm:grid-cols-3 gap-px bg-line">
                  <TrustStat value={0} suffix="%" label="Platform fee" />
                  <TrustStat value={5} prefix="~" suffix="s" label="Ledger settlement" />
                  <TrustStat value={18} suffix="/18" label="Contract tests passing" />
                  <TrustStat value={10} suffix="+" label="Verified on-chain interactions" />
                  <TrustStat value={100} suffix="%" label="Automated refunds" />
                  <TrustStat value={0} label="Custody of user funds" />
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ============ 12 · FAQ ============ */}
      <section className="pt-24">
        <Container className="max-w-3xl space-y-10">
          <Reveal>
            <SectionHeading eyebrow="FAQ" title="Frequently asked questions" center />
          </Reveal>
          <Reveal delay={0.06}>
            <Faq />
          </Reveal>
        </Container>
      </section>

      {/* ============ 13 · FINAL CTA ============ */}
      <section className="pt-24">
        <Container>
          <Reveal>
            <div className="relative overflow-hidden py-24 text-center">
              <div className="absolute inset-0 starfield opacity-40 pointer-events-none" aria-hidden="true" />
              <div className="relative space-y-6 max-w-2xl mx-auto">
                <h2 className="font-display text-3xl sm:text-4xl leading-[1.15] font-semibold text-fg tracking-[-0.02em]">
                  Your next idea could start here.
                </h2>
                <p className="text-base text-fg-muted max-w-xl mx-auto leading-[1.5]">
                  Launch a campaign or back one today — the escrow handles the rest.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <Button size="lg" href="/campaigns">Explore campaigns</Button>
                  <Button size="lg" variant="secondary" href="/campaigns/create">Start a campaign</Button>
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
  className,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  className?: string;
}) {
  return (
    <div className={cn("px-6 py-6 sm:px-8 sm:py-7", className)}>
      <p className="font-display text-2xl sm:text-[30px] font-semibold text-fg tabular">
        {typeof value === "number" ? <CountUp value={value} /> : value}{" "}
        {suffix && <span className="text-fg-faint text-sm font-medium">{suffix}</span>}
      </p>
      <p className="mt-1 text-[11px] uppercase tracking-wider text-fg-faint font-mono">{label}</p>
    </div>
  );
}

function TrustStat({
  value,
  label,
  prefix,
  suffix,
}: {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <div className="bg-surface px-6 py-7 space-y-2.5">
      <p className="font-display text-[26px] font-semibold text-fg tabular">
        <CountUp value={value} prefix={prefix} suffix={suffix} />
      </p>
      <p className="text-[11px] uppercase tracking-wider text-fg-faint font-mono leading-relaxed">{label}</p>
    </div>
  );
}

/** Three-node escrow track used in the follow-the-money cards. */
function EscrowTrack({ nodes, tone }: { nodes: [string, string, string]; tone: "success" | "warning" }) {
  const dot = tone === "success" ? "bg-success" : "bg-warning";
  return (
    <div className="flex items-center gap-2" aria-hidden="true">
      {nodes.map((n, i) => (
        <div key={n} className={cn("flex items-center gap-2", i > 0 && "flex-1")}>
          {i > 0 && <span className="h-px flex-1 bg-line-strong" />}
          <span className="flex items-center gap-1.5 whitespace-nowrap text-[11px] font-semibold text-fg-muted">
            <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
            {n}
          </span>
        </div>
      ))}
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
        <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-[-0.02em] text-fg">{title}</h2>
        {description && <p className="text-sm text-fg-muted leading-relaxed">{description}</p>}
      </div>
      {action}
    </div>
  );
}
