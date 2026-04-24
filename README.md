# OnboardBot

RAG-based onboarding assistant that answers questions about a LangChain codebase using its documentation as the knowledge source. Built with LangChain + TypeScript.

Final deliverable for **Path Code - Academia Lab 10**, Module 06.

## Problem

When a new developer joins a repo, they lose days reading README, ADRs, structure, and conventions. The same questions come up every time: "how do I add a new tool?", "what does this file do?", "how do I set up the environment?". OnboardBot answers those questions grounded in the repo's own docs, with citations — and refuses to answer when the info isn't there.

## Features

- **CLI-based** interactive REPL (no web UI, keeps scope tight).
- **RAG pipeline** over Markdown docs of a target repo (local HNSWLib vector store, no external infra).
- **Three production-grade guardrails** (see `docs/guardrails.md`):
  1. Anti-hallucination — answers must be grounded in retrieved context or refuse.
  2. Anti-prompt-injection — input validation against known manipulation patterns.
  3. Scope lock — only answers about the loaded corpus; off-topic queries are redirected.
- **Cited sources** on every answer (file name + chunk).
- **Spanish responses** by default (matches the audience).

## Requirements

- Node.js 20+
- npm 10+
- OpenRouter API key (for the LLM)
- OpenAI API key (for embeddings) — or any embedding provider you wire in

## Install

```bash
npm install
cp env.example .env
# Edit .env and add your keys
```

## Usage

**1. Build the index** from a target repo's docs:

```bash
npm run ingest -- ../10X-Builders-langchain-agent
```

This reads all `.md` files under the given path (excluding `node_modules`), chunks them, embeds them, and persists the vector store to `.index/`.

**2. Start the interactive CLI**:

```bash
npm run dev
```

Then ask questions:

```
> ¿Cómo agrego una nueva tool al agente?
> ¿Qué providers de vuelos soporta el sistema?
> ¿Qué hace runAgent.ts?
```

Type `/help` for commands, `/exit` to quit.

## Architecture

See `docs/architecture.md` for the layered design (interface → application → composition → domain → config).

## Guardrails

See `docs/guardrails.md` for the three guardrails, how they're tested, and what they do NOT cover.

## Project Structure

```
onboardbot/
├── src/
│   ├── index.ts                  # CLI entry point
│   ├── config/env.ts             # Env loading + Zod validation
│   ├── agent/
│   │   ├── createAgent.ts        # Composes retriever + LLM + prompt
│   │   ├── runAgent.ts           # Single-query execution
│   │   ├── prompt.ts             # System prompt (restrictive)
│   │   ├── retriever.ts          # Loads vector store, retrieves context
│   │   └── guardrails/           # Input/output validators
│   │       ├── inputValidator.ts
│   │       ├── outputValidator.ts
│   │       ├── scopeLock.ts
│   │       └── patterns.ts
│   └── ingest/buildIndex.ts      # Corpus ingestion pipeline
├── tests/                        # Vitest tests (guardrails + retrieval)
├── docs/
│   ├── brief.md                  # Project brief
│   ├── plan.md                   # Implementation plan by phases
│   ├── architecture.md           # Layered architecture
│   └── guardrails.md             # Guardrails design + test strategy
└── .index/                       # Persisted vector store (gitignored)
```

## Scripts

| Script | What it does |
|--------|--------------|
| `npm run dev` | Runs the interactive CLI with `tsx` |
| `npm run ingest -- <path>` | Builds the vector index from a target repo |
| `npm run build` | Compiles TypeScript to `dist/` |
| `npm run start` | Runs the compiled build |
| `npm test` | Runs Vitest once |
| `npm run typecheck` | Type-checks without emitting |

## Status

Phases 1–4 complete. Guardrails implemented and tested (16 unit tests, logic-only). See `docs/plan.md` for phase-by-phase progress.

## License

MIT
