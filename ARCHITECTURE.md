# Architecture

CrowdFundX is a Next.js App Router application backed by a Soroban
escrow contract on Stellar Testnet. Campaign *content* lives in the
database; campaign *money and rules* live in the contract.

```
Browser (Next.js client components)
   │  React Query / fetch
   ▼
Next.js API routes (app/api/**)          ← Postgres/SQLite via Prisma
   │  reads/writes campaign content, users, donations ledger
   │
   │  (contributions take a separate, signed path)
   ▼
Freighter wallet ──signs XDR──► Soroban RPC ──► Crowdfund contract
                                                 (native XLM escrow)
                                                       │
                                                 Stellar Testnet ledger
```

## The two ledgers

| Concern | Lives in | Why |
| --- | --- | --- |
| Campaign stories, media, status, comments | Prisma DB | Rich content doesn't belong on-chain |
| Goals, deadlines, raised amounts, refunds | Soroban contract | Rules must be enforced without trusting the platform |
| Donation records (+ tx hash) | Both | Contract moves the money; DB indexes it for the UI |

A frontend donation never routes money through the server: the client
builds the `donate` XDR (`lib/stellar/soroban.ts`), Freighter signs
it, it is submitted to Soroban RPC, and only the resulting tx hash is
reported to the API for indexing.

## Contract interface (deployed as `CDXS34…QKVF`)

| Entrypoint | Args | Auth | Notes |
| --- | --- | --- | --- |
| `initialize` | `admin: Address, token: Address` | admin | once; native XLM token on Testnet |
| `create_campaign` | `creator: Address, goal: i128, deadline: u64` | creator | goal > 0; deadline future, ≤ 365 days; sequential IDs |
| `donate` | `contributor: Address, campaign_id: u64, amount: i128` | contributor | real token transfer into escrow |
| `withdraw` | `caller: Address, campaign_id: u64` | creator | one-shot; requires raised ≥ goal |
| `claim_refund` | `contributor: Address, campaign_id: u64` | contributor | after deadline, raised < goal; zeroes the donation |
| `get_campaign` / `get_donation` | reads | — | view functions |

Amounts are stroops (1 XLM = 10⁷ stroops). Events: `created`,
`donated`, `withdraw`, `refunded`.

Storage: contract-level config (`Token`, `Count`) in instance
storage; `Campaign(id)` and `Donation(addr, id)` in persistent
storage, TTL-extended past each deadline plus a 90-day grace window.

App ↔ contract mapping: seeded campaigns use escrow IDs 3–6
(Soroban Pay, NeuroStellar, Lumina Learn, and an active reserve),
with ID 7 deliberately expired for the refund demo. Campaigns without
their own escrow fall back to ID 3.

## Wallet auth (session layer)

1. Server issues a nonce challenge (`/api/auth/challenge`).
2. Freighter signs it; `/api/auth/verify` checks the signature and
   returns a JWT (`jose`, 15-minute TTL).
3. Signed routes (`/api/auth/me`, donation indexing) validate the JWT.

## Frontend systems

- **Tokens** — `app/globals.css`: light-first `@theme` with a
  `data-theme="dark"` inversion block. All components consume
  semantic tokens; no per-component theming.
- **Theme bootstrap** — inline script in the root layout applies the
  stored/system theme pre-hydration (`lib/theme.ts`).
- **Motion** — one easing/duration/spring source in `lib/motion.ts`;
  page transitions via `AnimatePresence` keyed by pathname.
- **3D** — hero scene in `components/three/` (React Three Fiber),
  lazy-loaded with reduced-motion and no-WebGL fallbacks.

## Environment

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Prisma datasource |
| `NEXT_PUBLIC_CROWDFUND_CONTRACT_ID` | Escrow contract ID baked into the client |
| `NEXT_PUBLIC_NATIVE_XLM_CONTRACT` | Native XLM token contract (default: Testnet) |
| `NEXT_PUBLIC_STELLAR_NETWORK` / `_PASSPHRASE` / `_RPC_URL` | Network selection |
| `JWT_SECRET` | Session token signing |

See `.env.example` for defaults and the README for the deployment
record.
