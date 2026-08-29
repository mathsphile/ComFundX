# Contributing to CrowdFundX

Thanks for your interest. This document gets you from clone to a
verified contribution as fast as possible.

## Prerequisites

| Tool | Minimum | Check with |
| --- | --- | --- |
| Node.js | 20.x | `node -v` |
| Rust (stable) | 1.95 | `rustc --version` |
| `wasm32v1-none` target | — | `rustup target list --installed` |
| Stellar CLI | 25.2.0 | `stellar --version` |

## Setup

```bash
git clone https://github.com/mathsphile/ComFundX.git
cd ComFundX
npm install
cp .env.example .env          # fill in DATABASE_URL and secrets
npx prisma generate && npx prisma db push
npm run db:seed               # seeded campaigns are mapped to on-chain escrow IDs 3-7
```

## Everyday commands

```bash
npm run dev                   # frontend on http://localhost:3000
npm run contract:test         # Soroban unit tests
npm run contract:build        # optimized WASM via the Stellar CLI
npm run verify                # the full local quality gate
```

`npm run verify` is exactly what CI runs: `cargo fmt --check`,
`cargo clippy -D warnings`, `cargo test`, `tsc --noEmit`, and a
production build.

## Working on the contract

- Source: `contracts/crowdfund/src/lib.rs`, tests in `src/test.rs`.
- Every behavioral change needs tests — boundary values and rejection
  paths, not just the happy path.
- **Do not change entrypoint names, argument order, or storage key
  shapes** without updating `lib/stellar/soroban.ts` and the README
  deployment record; the frontend builds XDR against that interface.
- The deployed contract is immutable. A changed WASM means a new
  deployment, a new contract ID, and updated environment variables —
  document the actual values in the README.

## Working on the frontend

- Design language: `design.md` is the source of truth. Reuse the token
  system (`app/globals.css`) and motion presets (`lib/motion.ts`) —
  never hand-roll colors or easings.
- Both themes must work: check your change in light and dark mode.
- Respect `prefers-reduced-motion` (handled globally by
  `MotionConfig reducedMotion="user"`; opt out of JS-driven loops with
  `useReducedMotion`).
- Never fabricate product data: pages render from the database and the
  Stellar ledger. Empty states are a valid design outcome.

## Commit style

Conventional-style prefixes: `feat:`, `fix:`, `test:`, `docs:`,
`chore:`, `ci:`. One logical change per commit; keep the suite green.

## Pull request checklist

- [ ] `npm run verify` passes locally
- [ ] New behavior is covered by tests
- [ ] No secrets in the diff (`.env` is git-ignored for a reason)
- [ ] Screenshots for visual changes (light + dark)
