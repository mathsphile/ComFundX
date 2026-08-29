# Security Policy

## Scope

CrowdFundX runs a Soroban escrow contract on **Stellar Testnet**.
Nothing in this repository is production infrastructure yet; the
policy below describes how security is handled as the project matures.

**Internal review status:** the contract has passed an internal
security review and a 23-test suite covering authorization, lifecycle
transitions, double-spend/double-refund paths, and deadline
boundaries. **No external audit has been performed.** Do not treat
this contract as audited.

## What the contract enforces

These guarantees are enforced on-chain, not by the frontend:

- `require_auth` on every state-changing entrypoint — the acting
  address must sign.
- One-shot, creator-only withdrawals; withdrawal requires goal reached.
- One-shot refunds per contributor; refunds only after the deadline on
  failed campaigns, and never after a successful withdrawal.
- Sequential, contract-assigned campaign IDs; validated goals and
  deadlines (future, ≤ 365 days).
- Admin-authorized, one-time initialization.
- Persistent entries TTL-extended past the deadline + grace window so
  escrow state cannot expire while funds are held.

## Reporting a vulnerability

Open a **private** report — do not file a public issue for anything
that could put funds or keys at risk:

- GitHub: use the repository's private vulnerability reporting if
  enabled, or contact the maintainer directly.
- Include: description, reproduction steps, affected entrypoint or
  component, and potential impact.

## Secrets hygiene

- `.env` is git-ignored and must never be committed.
- Stellar identities live in the Stellar CLI keyring
  (`~/.soroban`), not in this repository.
- CI secrets are injected via GitHub Actions environment variables;
  placeholder values in `.env.example` are not real credentials.
