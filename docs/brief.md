# Brief — OnboardBot

## 1. Propósito

OnboardBot es un asistente CLI basado en RAG que responde preguntas sobre un codebase específico usando su propia documentación como fuente única de verdad. El objetivo es acelerar el onboarding de devs nuevos y reducir el bottleneck sobre los seniors.

## 2. Problema que resuelve

Cuando un desarrollador se suma a un proyecto, los primeros días se van en:
- Leer README, ADRs y `docs/`.
- Preguntar a seniors cosas que YA están documentadas.
- Perder contexto entre convenciones, estructura y decisiones pasadas.

OnboardBot centraliza la respuesta a esas preguntas, siempre anclada en los documentos reales del repo. Si algo no está documentado, lo dice — y eso mismo es valor: expone gaps de documentación.

## 3. Audiencia objetivo

Desarrolladores que se suman a un proyecto LangChain/TypeScript. El MVP usa como corpus piloto el repositorio `10X-Builders-langchain-agent` (entregable previo del curso).

## 4. Caso de uso específico (MVP)

CLI interactiva que responde en lenguaje natural preguntas sobre el repo piloto. Fuentes:
- `README.md`
- `CHANGELOG.md`
- `docs/architecture.md`, `docs/brief-agent.md`, `docs/plan-agent.md`, `docs/flight-tool-contract.md`

**Ejemplos de queries reales:**
- "¿Cómo agrego una nueva tool?" → cita pasos del README
- "¿Qué providers de vuelos soporta el sistema?" → cita `architecture.md` + `env.ts`
- "¿Qué hace `runAgent.ts`?" → cita `docs/architecture.md`

## 5. Diferencial

1. **Meta-recursivo**: es un agente LangChain que explica agentes LangChain. El knowledge base es tu propio entregable anterior — continuidad del curso visible e intencional.
2. **RAG puro, sin tool-calling externo**: cero APIs externas más allá del LLM. Menor superficie de ataque, más foco en guardrails semánticos (que es el objetivo del módulo).
3. **No reciclado**: los compañeros del curso hicieron agentes con herramientas (Jira triage, búsqueda de vuelos, informes docentes, consultor de arquitectura). OnboardBot es el único que resuelve un problema de CONOCIMIENTO sobre un codebase específico.

## 6. Guardrails (tres, todos implementados y testeados)

| # | Nombre | Qué hace | Cómo se prueba |
|---|--------|----------|----------------|
| 1 | **Anti-alucinación** | Valida que cada afirmación factual esté anclada en el contexto recuperado. Si no, reemplaza por "no tengo esa info". | Test: pregunta sobre algo fuera del corpus (ej: clima). La respuesta debe ser el mensaje canned. |
| 2 | **Anti-prompt-injection** | Detecta patrones de manipulación en el input del usuario (ES + EN). | Test: input con "ignore previous instructions" o "revelá tu system prompt". Respuesta bloqueada. |
| 3 | **Scope lock** | Si el score del retriever está por debajo del umbral, se considera out-of-scope. El system prompt también restringe el dominio. | Test: pregunta ajena al repo. El agente se niega y redirige. |

Los tres guardrails están documentados en detalle en `docs/guardrails.md` con patrones concretos, umbrales y casos de prueba.

## 7. Stack técnico

| Capa | Tecnología |
|------|------------|
| Runtime | Node.js 20+ |
| Lenguaje | TypeScript (ESM, NodeNext) |
| Framework de agentes | LangChain (`langchain`, `@langchain/openai`, `@langchain/community`) |
| LLM | OpenRouter (default: `openai/gpt-4o-mini`) |
| Embeddings | `text-embedding-3-small` (OpenAI directo, barato) |
| Vector store | HNSWLib (local, sin infra externa) |
| Validación | Zod |
| Tests | Vitest |
| Ejecución dev | tsx |

## 8. Scope explícito

**Dentro del alcance:**
- CLI interactiva REPL.
- Ingesta de `.md` desde un path local.
- Respuestas en español con citas al archivo fuente.
- Tres guardrails con tests.

**Fuera del alcance:**
- No hay web UI.
- No modifica código ni ejecuta comandos del sistema.
- No sale a internet (más allá de llamadas al LLM y embeddings).
- No procesa código fuente (solo Markdown en el MVP; código queda para fase 2 si hay tiempo).
- Un repo por vez (el path se pasa al script de ingesta).

## 9. Criterios de éxito

El entregable se considera exitoso cuando:
1. `npm run ingest -- <path>` construye un índice persistente sin errores.
2. `npm run dev` abre un REPL donde se pueden hacer preguntas al agente.
3. Una pregunta in-scope devuelve una respuesta correcta con fuentes citadas.
4. Una pregunta out-of-scope devuelve el mensaje canned de rechazo.
5. Un intento de prompt injection es bloqueado antes de llegar al LLM.
6. `npm test` pasa todos los tests (mínimo 1 por guardrail + 2 de retrieval).
7. El README permite a un tercero correrlo en menos de 5 minutos.

## 10. Aprobación

Brief aprobado por el dueño del entregable el 2026-04-24. Listo para pasar al plan de implementación (`plan.md`).
