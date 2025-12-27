# EUDI Wallet & Age Verification — Research Summary

Date: 2025-12-27

This document summarizes research into EUDI Wallet concepts, relevant standards, competing projects and npm packages, recommended integration patterns for a Next.js addon that provides age verification and pairwise identifiers, suggested public API surface, security/privacy considerations, and next steps.

## Key Standards and Specifications
- European Digital Identity (EUDI) Wallet — policy and reference frameworks: https://digital-strategy.ec.europa.eu/en/policies/eu-digital-identity
- eIDAS Regulation (EU) 910/2014 — legal baseline for electronic identification: https://eur-lex.europa.eu/eli/reg/2014/910/oj
- W3C Verifiable Credentials Data Model 1.0 — credential model: https://www.w3.org/TR/vc-data-model/
- W3C Decentralized Identifiers (DID) Core — DIDs & resolution: https://www.w3.org/TR/did-core/
- Presentation Exchange (DIF) — request/response definitions for presentations: https://identity.foundation/presentation-exchange/
- OpenID for Verifiable Presentations / OpenID4VCI — OIDC profiles for VCs/VPs: https://openid.net/
- GDPR (2016/679) — data protection rules that apply to identity flows: https://eur-lex.europa.eu/eli/reg/2016/679/oj

## Competitor / Ecosystem Analysis
Findings: no dominant Next.js-specific open-source addon was found that implements a full EUDI Wallet age verification + pairwise ID solution. Most relevant projects are general-purpose DID/VC libraries, commercial age-verification SDKs, or EU reference implementations (mobile wallets). Below are relevant projects and why they matter.

- Veramo (@veramo/core) — agent framework for DID/VC operations; Apache-2.0; good server-side building block for issuance and verification. Repo: https://github.com/veramo/veramo, npm: https://www.npmjs.com/package/@veramo/core
- did-jwt-vc — library for JWT-formatted VCs/VPs; ISC license; useful for web-friendly, compact VC flows. Repo: https://github.com/decentralized-identity/did-jwt-vc, npm: https://www.npmjs.com/package/did-jwt-vc
- DIDKit (SpruceID) — high-quality crypto & VC tooling (WASM/bindings); Apache-2.0; useful as backend verification component. Repo: https://github.com/spruceid/didkit, npm: https://www.npmjs.com/package/didkit
- @digitalbazaar/vc (vc-js) — Linked Data VC issuer/verifier with selective-disclosure support; BSD-3-Clause. Repo: https://github.com/digitalbazaar/vc, npm: https://www.npmjs.com/package/@digitalbazaar/vc
- next-auth — de facto Next.js authentication library; useful adapter point for session integration. Repo: https://github.com/nextauthjs/next-auth, npm: https://www.npmjs.com/package/next-auth
- OpenID4VCI / OIDC libraries — packages and specs for OpenID flows exchanging VCs: https://github.com/openid and packages like @openid4vc/openid4vci

Commercial / SDK providers (fallbacks):
- Yoti — age assurance and digital ID provider; Node and web SDKs. https://www.yoti.com/ and https://github.com/getyoti/yoti-node-sdk
- Onfido — document & biometric verification SDKs for web. https://onfido.com/ and https://github.com/onfido/onfido-sdk-ui
- Jumio — enterprise identity verification with web SDKs. https://www.jumio.com/

Notes on naming collisions: many EU reference repos use `eudi-wallet` in their names. Avoid naming your package exactly `eudi-wallet` — prefer a scoped name like `@your-scope/next-eudi`.

## Recommended Integration Patterns (Next.js)
- Architecture: split responsibilities — client: wallet interaction, QR flows, SDK embeds; server: DID resolution, VC verification/issuance, pairwise-id derivation.
- Next.js features to use:
  - App Router server components / server actions for admin/config tasks.
  - Middleware (edge) for lightweight request gating (redirect to verification), keeping heavy crypto off edge.
  - API Route handlers (Node runtime) for full verification endpoints (e.g., `POST /api/eudi/verify`).
  - Client hooks and components for starting flows and reporting verification state.
- NextAuth compatibility: provide adapter helpers for `jwt()` and `session()` callbacks to attach `eudi_verified` flags and `pairwise_id`.

## Recommended Public API Surface (high level)
- Server helpers:
  - `createPresentationDefinition(def)` — create and return a Presentation Definition for OIDC4VP or CHAPI.
  - `verifyPresentation(presentation, options)` — verify VPs (JWT or object) and return verified claims.
  - `verifyAgeWithEudi(presentation, minAge)` — convenience wrapper returning `{ isOldEnough, assertion }`.
  - `createPairwiseId(linkSecretOrSeed, rpId)` — deterministic pairwise identifier derivation.
  - `issueAgeCredential(holder, assertion)` — issuance helper for minimal age-assertion VC.
- Client APIs:
  - `EudiProvider` — configure client endpoints.
  - `useEudiAuth()` — returns state and methods to start flows.
  - `useEudiAge(minAge)` — returns status and `requestAgeProof()` helper.
  - `EudiVerifyButton` — component to trigger verification UX.
  - `middlewareEudi(options)` — Next.js middleware factory to protect pages.

## Security, Privacy & Legal Considerations
- GDPR & data minimization: never persist raw DOB when only proof-of-minimum-age is required. Persist minimal assertions or pairwise pseudonymous identifiers only by opt-in.
- Pairwise identifiers: derive pseudonymous pairwise IDs using a per-holder link secret and RP identifier (HMAC/KDF). Do not export link secrets.
- Consent & purpose: require explicit consent prior to storing any personal data; include purpose text in Presentation Definitions and retention policies in documentation.
- Transport & integrity: use TLS; validate challenges/nonces and domain-binding to prevent replay; use short-lived session tokens by default.

## Suggested Dependencies and Tooling
- Runtime (recommended): `@veramo/core`, `did-jwt-vc`, `@digitalbazaar/vc` (for selective-disclosure), `did-resolver`, `jose` (JWT/JWS), `node-fetch`.
- Optional: `@openid4vc/openid4vci` (OIDC4VC helpers), `didkit` (WASM verification), `next-auth` adapter helpers.
- Dev: TypeScript, Vitest, ESLint, Prettier.

## Suggested Repository Layout (v0.1.0)
- README.md
- package.json
- tsconfig.json
- src/index.ts (exports)
- src/server/verifier.ts
- src/server/pairwise.ts
- src/server/presentation.ts
- src/client/EudiProvider.tsx
- src/client/hooks/useEudiAge.ts
- src/client/hooks/useEudiAuth.ts
- src/client/components/EudiVerifyButton.tsx
- src/middleware/eudiMiddleware.ts
- src/next-auth/adapter.ts
- examples/nextjs-example/* (minimal app)
- tests/unit/*.test.ts
- tests/integration/*.test.ts
- docs/privacy.md

## Suggested Package Name(s)
- `@your-scope/next-eudi` — full feature package (recommended scoped name)
- `@your-scope/next-eudi-age` — focused on age verification only

## Quick README Intro (one paragraph)
Next EUDI is a Next.js addon that helps developers add EUDI-compatible age verification and privacy-preserving pairwise identifiers to their apps. It supplies server helpers for Presentation Definitions and Verifiable Presentation verification, client hooks/components to start wallet or SDK flows, a middleware factory to gate routes by minimum age, and optional NextAuth adapters to attach verified claims to sessions.

## Next Steps
1. Confirm the default VC format: JWT-VC (recommended for web) or Linked Data VC.
2. Scaffold the repository with the suggested layout and implement the server verification core and pairwise derivation (I can start this next).
3. Create a minimal example Next.js app that demonstrates the verification flow and NextAuth integration.

## References and Links
- EUDI / EU digital identity: https://digital-strategy.ec.europa.eu/en/policies/eu-digital-identity
- eIDAS regulation: https://eur-lex.europa.eu/eli/reg/2014/910/oj
- W3C Verifiable Credentials: https://www.w3.org/TR/vc-data-model/
- DID Core: https://www.w3.org/TR/did-core/
- Presentation Exchange: https://identity.foundation/presentation-exchange/
- OpenID: https://openid.net/
- Veramo: https://github.com/veramo/veramo
- did-jwt-vc: https://github.com/decentralized-identity/did-jwt-vc
- @digitalbazaar/vc: https://github.com/digitalbazaar/vc
- Yoti (age verification): https://www.yoti.com/
- Onfido: https://onfido.com/