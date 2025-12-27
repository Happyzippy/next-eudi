# Plan for Next EUDI Addon

Date: 2025-12-27

This document explains the intended structure of the project and answers three design questions: how to make the addon easy to add to a project, how to minimize real-world deployment cost, and how to run serverless while caching trust lists.

## Structure
The `docs/plan.md` describes the plan and will be accompanied by a short example app in `examples/nextjs-example`. Core code will live under `src/` and be split into `server/`, `client/`, `middleware/`, and `next-auth/` areas. Public API entrypoint will be `src/index.ts` exporting server helpers and client hooks.

Core modules:
- `src/server/verifier.ts` — Verifiable Presentation verification and convenience wrappers (e.g., `verifyAgeWithEudi`).
- `src/server/pairwise.ts` — Deterministic pairwise identifier derivation helpers.
- `src/server/presentation.ts` — Presentation Definition creation helpers.
- `src/middleware/eudiMiddleware.ts` — Factory for Next.js middleware to protect routes.
- `src/client/EudiProvider.tsx` — Provider to configure endpoints, TTLs and hooks.
- `src/client/hooks/useEudiAge.ts` — Hook to request and track age verification.
- `src/next-auth/adapter.ts` — Helpers to integrate with NextAuth callbacks.

## 1) How to make it easy to add this login to a project

Principles:
- Minimal integration surface: provide a small set of exports that cover the common cases: `EudiProvider`, `useEudiAge`, `EudiVerifyButton`, `middlewareEudi`, and `createEudiAdapterForNextAuth`.
- Defaults-first: sensible defaults for Presentation Definition (prebuilt `over18` and `over21` defs), cache TTLs, and short-lived session tokens to avoid heavy configuration.
- Zero-setup dev mode: include `examples/nextjs-example` and a CLI `npx create-next-eudi` later to bootstrap.
- Clear NextAuth adapter: export `createEudiAdapterForNextAuth()` so projects using NextAuth only add two lines in their `[...]nextauth].ts` callbacks to incorporate verification state and pairwise id.

Recommended Quick Start (developer experience):
1. Install `@your-scope/next-eudi`.
2. Wrap the app with `EudiProvider` and configure the API base URL.
3. Add `middlewareEudi({ minAge: 18, redirectTo: '/verify' })` to guard pages (optional).
4. Use `useEudiAge(18)` in UI or `EudiVerifyButton` to start the verification.
5. For NextAuth: call `createEudiAdapterForNextAuth()` and wire the returned `onJwt`/`onSession` helpers into NextAuth callbacks.

Why this is easy:
- Few well-named entry points.
- Example app demonstrates wiring with minimal changes to `next.config.js` or NextAuth config.
- Clear error messages and diagnostic helpers (e.g., `EudiProvider` logs cache TTLs in dev).

## 2) How to keep real-world deployment cheapest

Goal: minimize CPU, memory and external API costs while preserving security and privacy.

Strategies:
- Prefer client-side proof generation and wallet-based flows (OIDC4VP / CHAPI) so the server only performs short-lived verification that can run in cheap serverless functions.
- Default to JWT-VCs for v0: verification with `jose` is fast and requires less heavy crypto than Linked Data Proofs (LD-P). Only support LD-P optionally because LD-P often requires WASM or heavier tooling.
- Stateless or ephemeral server behavior: derive pairwise IDs deterministically so persistent storage is optional. When possible, issue short-lived JWT assertions that the client stores, avoiding DB writes.
- Batch heavy operations: aggregate revocation/trust-list updates via scheduled jobs (e.g., once per hour) rather than checking remote lists on every request.
- Use pay-as-you-go hosting for light-load apps: Vercel/Netlify/AWS Lambda with small memory functions. Avoid always-on VMs or dedicated HSMs in v0 unless required by a provider.
- Offer optional commercial provider adapters (Yoti/Onfido) but keep them opt-in; these providers increase per-user costs so they should not be the default.

Concrete cost-saving defaults:
- JWT-VC verification only (fast path) in serverless functions.
- Short-lived tokens (15m) for verified assertions to avoid DB session storage.
- Pairwise IDs derived on-demand from link-secret + rp identifier (no DB by default).
- Revocation checks: only check status-lists with TTL and background refresh; do not call remote provider every verification request.

## 3) Serverless feasibility & caching trust lists

Yes — the addon can be serverless-friendly. Key constraints and tactics:

What must run server-side:
- VP/VC verification (signature verification, DID resolution for issuer keys, revocation/status checks).
- Pairwise derivation (cryptographic HMAC or KDF using a per-wallet secret — but secret must be protected; if held server-side, use secure secret storage).

Where to cache trust assets (JWKS, DID docs, revocation lists): multi-tier caching strategy:

- Tier 1: CDN / static hosting (long-lived, e.g., 1h TTL) — host static trust lists or mirror static issuer metadata on a CDN edge. Good for public issuer metadata with low change frequency.
- Tier 2: Edge KV (e.g., Vercel Edge Config, Cloudflare Workers KV, Netlify Edge) — fast read access close to the user, TTL ~15m, supports global scale with low latency and low cost for reads.
- Tier 3: In-function in-memory cache (short TTL, e.g., 30–60s) — very cheap reads for bursty traffic; on cold starts the function fetches the cache and stores it for the function lifetime.
- Tier 4: Background refresh / scheduled job — periodically refresh trust lists and status-lists (e.g., via a scheduled serverless job or cron job) and push to CDN/Edge KV to avoid many on-demand fetches.

Revocation and status lists:
- Avoid individual remote calls for each verification. Instead, fetch status-lists (e.g., credential status or revocation lists) periodically and cache them in Edge KV. For critical scenarios allow an option to do realtime checks but mark it as costly.

Practical implementation notes:
- Provide a `TrustCache` interface with pluggable adapters: `Cd nAdapter`, `EdgeKVAdapter`, `InMemoryAdapter`. Default to `InMemoryAdapter` in dev, `EdgeKVAdapter` in prod when available.
- Expose configuration in `EudiProvider` and server verifier to set TTLs and adapter priorities.

Edge-case: DID resolution and resolver drivers
- Many DID resolvers require network calls (IPFS, blockchain RPCs). For serverless, prefer DID methods with HTTP resolvers (did:web, did:key, did:ethr via RPC proxy) and cache the DID Document in Edge KV.

## Example configuration choices (defaults)
- `verify.defaultVcFormat = 'jwt'`
- `trust.ttl.cdn = 3600` (1 hour)
- `trust.ttl.edge = 900` (15 minutes)
- `trust.ttl.inFunction = 60` (1 minute)
- `session.assertionTtl = 900` (15 minutes)

## Example flow (serverless verification)
1. Client initiates OIDC4VP or QR wallet flow and receives a VP (JWT) from the wallet.
2. Client calls `POST /api/eudi/verify` with the VP.
3. `verifyPresentation` runs in a serverless function: it loads issuer JWKS/DID from `TrustCache` (fast read), verifies signature using `jose`, checks presentation challenge & domain, and consults cached revocation lists.
4. On success, the server returns a short-lived signed assertion JWT containing `eudi_verified: true` and a `pairwise_id` (derived on-the-fly). No DB writes required.

## Next steps (implementation plan)
1. Implement `TrustCache` interface and `InMemoryAdapter` to be used in dev.
2. Implement `createPairwiseId(linkSecretOrSeed, rpId)` in `src/server/pairwise.ts`.
3. Implement `verifyPresentation` using `jose` and a simple DID/JWKS fetcher with `TrustCache`.
4. Add `middlewareEudi` for edge-friendly redirect behavior.
5. Add `examples/nextjs-example` demonstrating serverless deploy and Edge KV caching (optional: provide instructions for Vercel and Cloudflare).

---

If you confirm defaults (JWT-VC for v0, commercial SDKs opt-in), I will now: (A) complete `docs/plan.md` (this file) and mark it done, and (B) scaffold code files and implement `TrustCache`, `pairwise` and `verifier` stubs next. Which do you prefer I start implementing now?
