# Arquitectura — OnboardBot

## Principios

- **Separación por capas**: cada responsabilidad en su lugar, nada de lógica de negocio en la interfaz ni I/O en el dominio.
- **Dependency injection** en los puntos de orquestación (test-friendly).
- **Configuración validada** en el borde (Zod en `config/env.ts`), no dispersa por el código.
- **Guardrails como ciudadanos de primera**: tienen su propio módulo, sus propios tests, y son explícitos en el flujo — no escondidos dentro del prompt.

## Capas

```
┌──────────────────────────────────────────────────────────────┐
│  Interface Layer                                             │
│  src/index.ts  — CLI REPL (readline)                         │
└────────────────────────┬─────────────────────────────────────┘
                         │ calls
┌────────────────────────▼─────────────────────────────────────┐
│  Application Layer                                           │
│  src/agent/runAgent.ts — single-query execution              │
└────────────────────────┬─────────────────────────────────────┘
                         │ uses
┌────────────────────────▼─────────────────────────────────────┐
│  Composition Layer                                           │
│  src/agent/createAgent.ts — wires retriever + LLM + guards   │
└───────────────┬───────────────┬──────────────┬───────────────┘
                │               │              │
┌───────────────▼───┐  ┌────────▼──────┐  ┌────▼──────────────┐
│  Domain           │  │  Domain       │  │  Domain           │
│  retriever.ts     │  │  prompt.ts    │  │  guardrails/*     │
│  (HNSWLib)        │  │  (templates)  │  │  (input/output)   │
└───────────────────┘  └───────────────┘  └───────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────────┐
│  Configuration Layer                                         │
│  src/config/env.ts — Zod-validated env                       │
└──────────────────────────────────────────────────────────────┘
```

## Flujo de una consulta

```
User input (CLI)
      │
      ▼
┌─────────────────────────────┐
│ Input Validator (Guardrail) │  ── blocked? ──► canned response ──► User
│  - max length                │
│  - injection patterns        │
└──────────────┬──────────────┘
               │ pass
               ▼
┌─────────────────────────────┐
│ Retriever                   │
│  - top-k from HNSWLib       │
│  - score per chunk          │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Scope Guard (Guardrail)     │  ── all scores < threshold? ──► out-of-scope ──► User
└──────────────┬──────────────┘
               │ pass
               ▼
┌─────────────────────────────┐
│ Prompt Builder              │
│  - system prompt (restr.)   │
│  - user prompt + contexto   │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ LLM (OpenRouter)            │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Output Validator (Guardrail)│  ── no citations / hallucination? ──► canned ──► User
│  - require [fuente: X.md]   │
│  - cited files in retrieved │
└──────────────┬──────────────┘
               │ pass
               ▼
       Final response to user
```

## Flujo de ingesta (build del índice)

```
npm run ingest -- <path>
        │
        ▼
┌──────────────────────────┐
│ Walk filesystem          │  *.md, excluye node_modules, dist, .index
└───────────┬──────────────┘
            │
            ▼
┌──────────────────────────┐
│ Chunker                  │  RecursiveCharacterTextSplitter (500/50)
└───────────┬──────────────┘
            │
            ▼
┌──────────────────────────┐
│ Embedder                 │  OpenAIEmbeddings (text-embedding-3-small)
└───────────┬──────────────┘
            │
            ▼
┌──────────────────────────┐
│ Persistencia             │  HNSWLib → .index/
└──────────────────────────┘
```

## Decisiones clave

1. **HNSWLib vs. Chroma**: elegimos HNSWLib para mantener el MVP sin infra externa. Chroma requeriría Docker; HNSWLib corre in-process y persiste a disco. Si en el futuro el corpus supera ~100k chunks, migrar a Chroma o Qdrant.

2. **Embeddings en OpenAI directo, no OpenRouter**: OpenRouter no soporta embeddings de forma estable a la fecha. Mantenemos OpenAI directo para este caso. Si esto cambia, la capa de embeddings queda aislada en `ingest/buildIndex.ts` y es fácil de rotar.

3. **Guardrails en capa de dominio, no en el prompt solamente**: el system prompt ayuda pero no basta. Los validadores imperativos (entrada/salida) dan garantías, no ruegos. El prompt es la defensa en profundidad, no la primera línea.

4. **CLI, no API HTTP**: el entregable es un agente funcional, no un servicio. Una API añade superficie de ataque (CORS, rate limiting, auth) irrelevante al objetivo del módulo.

5. **Sin memoria de conversación en el MVP**: cada query es independiente. Si se necesita, se añade en fase 2 con `BufferMemory`, pero complica los guardrails (una query "aparentemente out-of-scope" puede ser seguimiento de una in-scope previa).

## Extensibilidad

- **Nuevo corpus**: correr `npm run ingest -- <nuevo-path>` apuntando a otro `INDEX_PATH`.
- **Nuevo LLM**: cambiar `OPENROUTER_MODEL` en `.env`.
- **Nuevos guardrails**: agregar validador en `src/agent/guardrails/` y encadenarlo en `createAgent.ts`.
- **Soporte de código fuente (no solo Markdown)**: extender el walker en `buildIndex.ts` para aceptar `.ts`, `.js`, `.py` con un chunker específico por lenguaje.
