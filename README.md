# OnboardBot

Agente RAG conversacional que responde preguntas sobre un codebase usando su propia documentación como fuente de verdad. Hecho con **LangChain + TypeScript**.

Entregable final para **Path Code — Academia Lab 10**, Módulo 06.

## Qué problema resuelve

Cuando un dev nuevo se suma a un repo se le van días leyendo README, ADRs, estructura y convenciones. Las preguntas son siempre las mismas: "¿cómo agrego una tool?", "¿qué hace este archivo?", "¿cómo configuro el entorno?". OnboardBot responde esas preguntas anclado a los documentos reales del proyecto, con citas — y se niega cuando la info no está. Eso último es importante: si algo no está documentado, lo dice. No inventa.

## Qué hace

- **CLI interactiva** (REPL en consola, sin UI web — me mantengo enfocado en el agente).
- **Pipeline RAG** sobre los `.md` de cualquier repo, con vector store local en HNSWLib (cero infra externa).
- **Tres guardrails de verdad** (no solo en el prompt — código imperativo con tests). Detalle completo en `docs/guardrails.md`:
  1. **Anti-prompt-injection**: valida la entrada con regex en ES/EN antes de tocar el LLM.
  2. **Anti-alucinación**: si la respuesta no cita fuentes del corpus recuperado, la reemplaza por texto predefinido.
  3. **Scope-lock**: si el retrieval no alcanza el umbral mínimo, el agente se niega antes de llamar al modelo.
- **Citas siempre** al final de cada afirmación (`[fuente: archivo.md]`).
- **Responde en español** por defecto.

## Requisitos

- Node.js 20+
- npm 10+
- API key de OpenRouter (para el LLM)
- API key de OpenAI (para los embeddings)

## Instalación

```bash
npm install
cp env.example .env
# Editá .env y poné tus claves
```

## Uso

**1. Construí el índice** apuntando a un repo cualquiera:

```bash
npm run ingest -- ../10X-Builders-langchain-agent
```

Esto lee todos los `.md` del path (excluyendo `node_modules`, `dist`, `.git`, etc.), los chunkea, los embeddea y persiste el vector store en `.index/`.

**2. Levantá la CLI**:

```bash
npm run dev
```

Y preguntale lo que quieras del repo:

```
> ¿Cómo agrego una nueva tool al agente?
> ¿Qué providers de vuelos soporta el sistema?
> ¿Qué hace runAgent.ts?
```

Comandos de la REPL: `/help`, `/sources` (muestra las fuentes de la última respuesta), `/exit`.

## Arquitectura

Diseñado por capas: interface → application → composition → domain → config. El detalle completo (con diagramas y decisiones clave) está en `docs/architecture.md`.

## Guardrails

Cada uno con su lógica, sus tests, y la lista explícita de lo que **no** cubre. Ver `docs/guardrails.md`.

## Estructura del proyecto

```
onboardbot/
├── src/
│   ├── index.ts                  # CLI entry point
│   ├── config/env.ts             # Carga + validación de env con Zod
│   ├── agent/
│   │   ├── createAgent.ts        # Compone retriever + LLM + prompt + guardrails
│   │   ├── runAgent.ts           # Wrapper de ejecución
│   │   ├── prompt.ts             # System prompt restrictivo
│   │   ├── retriever.ts          # Carga el vector store y trae contexto
│   │   └── guardrails/
│   │       ├── inputValidator.ts # G1 — anti-injection
│   │       ├── outputValidator.ts# G2 — anti-alucinación
│   │       ├── scopeLock.ts      # G3 — scope semántico
│   │       └── patterns.ts       # Regex de injection (ES + EN)
│   └── ingest/buildIndex.ts      # Pipeline de ingesta
├── tests/                        # Vitest, lógica pura (sin LLM, sin red)
├── docs/
│   ├── brief.md                  # Brief del proyecto
│   ├── plan.md                   # Plan por fases
│   ├── architecture.md           # Arquitectura
│   └── guardrails.md             # Guardrails: spec + tests + lo que no cubren
└── .index/                       # Vector store persistido (gitignored)
```

## Scripts

| Script | Para qué sirve |
|--------|----------------|
| `npm run dev` | Levanta la CLI interactiva con `tsx` |
| `npm run ingest -- <path>` | Construye el índice del repo objetivo |
| `npm run build` | Compila a `dist/` |
| `npm run start` | Corre el build compilado |
| `npm test` | Corre los tests de Vitest una vez |
| `npm run typecheck` | Chequeo de tipos sin emitir build |

## Estado

Fases 0 a 5 completas. **16 tests unitarios** verdes (todos lógicos, sin red). Falta solo la fase de demo. Progreso detallado en `docs/plan.md`.

## Licencia

MIT
