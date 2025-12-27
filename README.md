# Next EUDI - EUDI Wallet Age Verification for Next.js

A Next.js addon providing EUDI-compatible age verification and privacy-preserving pairwise identifiers.

## Quick Start

```bash
npm install @emtyg/next-eudi
```

See [docs/plan.md](docs/plan.md) for full documentation.

## Development

```bash
# Build library
cd next-eudi
npm run build

# Watch mode
npm run dev

# Link to example app
npm link
cd ../examples/nextjs-example
npm link @emtyg/next-eudi
npm run dev
```

## VS Code

Use the launch configuration "Next.js Example (Dev)" to run the example app with the library linked.

## Structure

- `/next-eudi` - Library source
- `/examples/nextjs-example` - Demo Next.js app
- `/docs` - Documentation

## License

MIT
