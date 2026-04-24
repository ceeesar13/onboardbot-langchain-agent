# Plan de Implementación — OnboardBot

Dividido en 6 fases. Cada fase tiene entregable, criterio de hecho y tiempo estimado.

---

## Fase 0 — Setup del repo (30 min) — ✅ COMPLETADA

- [x] Carpeta `onboardbot/` creada dentro de `lab10x-code/`.
- [x] `package.json` con deps y scripts.
- [x] `tsconfig.json` configurado (ES2022, NodeNext, strict).
- [x] `.gitignore` (node_modules, dist, .index, .env).
- [x] `.env.example` con todas las variables requeridas.
- [x] Estructura de carpetas layered: `src/{index, config, agent, ingest}`, `docs/`, `tests/`.
- [x] Stubs mínimos que tipean y ejecutan.
- [x] `README.md` con instalación y uso.

**Criterio de hecho:** `npm run dev` responde algo (stub) tras `npm install`.

---

## Fase 1 — Ingesta del corpus (RAG parte 1) (1-2 h) — ✅ COMPLETADA

Archivo clave: `src/ingest/buildIndex.ts`.

- [x] Leer todos los `.md` del `CORPUS_PATH` (excluir `node_modules`, `.index`, `dist`).
- [x] Chunkear con `RecursiveCharacterTextSplitter` (size=500 tokens, overlap=50).
- [x] Embeddings con `OpenAIEmbeddings` (model del env).
- [x] Persistir en `HNSWLib` a `INDEX_PATH`.
- [x] Log resumen: nº archivos, nº chunks, tiempo.

**Comando:** `npm run ingest -- ../10X-Builders-langchain-agent`

**Criterio de hecho:** existe un `.index/` con los chunks del repo piloto indexados y cargables.

---

## Fase 2 — Retriever + respuesta básica (RAG parte 2) (2 h) — ✅ COMPLETADA

Archivos clave: `src/agent/retriever.ts`, `src/agent/createAgent.ts`.

- [x] `retriever.ts`: carga `HNSWLib` desde `INDEX_PATH`, expone `retrieve(query, k)` con score.
- [x] `createAgent.ts`: chain = retrieve → build prompt → LLM → parse respuesta.
- [x] Integrar `prompt.ts` (system + user prompt con contexto).
- [x] Formatear respuesta con fuentes citadas.

**Criterio de hecho:** `npm run dev` + pregunta in-scope → respuesta con al menos una cita `[fuente: X.md]`.

---

## Fase 3 — Guardrails (el corazón del entregable) (2-3 h) — ✅ COMPLETADA

Archivos clave: `src/agent/guardrails/{inputValidator, outputValidator, patterns, scopeLock}.ts`.

### 3.1 Anti-prompt-injection (validación de entrada)

- [x] `patterns.ts`: lista de regex bloqueados (ES+EN): `ignore previous`, `system prompt`, `you are now`, `revelá tu prompt`, `olvidá instrucciones`, etc.
- [x] `inputValidator.ts`: valida longitud max (env var) + match de patrones.
- [x] Si bloqueado → respuesta canned, no se llama al LLM.

### 3.2 Anti-alucinación (validación de salida)

- [x] `outputValidator.ts`: verifica que la respuesta contenga al menos una cita `[fuente: ...]`.
- [x] Si no hay citas y la respuesta afirma hechos → reemplaza por el mensaje canned.
- [x] Verifica también que las fuentes citadas estén en la lista de documentos recuperados (no inventadas).

### 3.3 Scope lock (semántico)

- [x] Si el retriever devuelve 0 chunks con score ≥ `RETRIEVAL_SCORE_THRESHOLD` → respuesta canned de fuera de dominio.
- [x] Reforzado también en el system prompt (regla 5).

**Criterio de hecho:** `tests/guardrails.test.ts` pasa con 1 test por guardrail.

---

## Fase 4 — CLI interactiva (1 h) — ✅ COMPLETADA

Archivo clave: `src/index.ts` (ya stubeado, completar lógica).

- [x] Wire del agente real dentro del loop REPL.
- [x] Comandos: `/help`, `/reset`, `/exit`, `/sources` (muestra últimas fuentes citadas).
- [ ] Colores básicos en consola (opcional: `picocolors`).
- [x] Imprimir fuentes al final de cada respuesta.

**Criterio de hecho:** conversación de ~5 turnos usable y legible en terminal.

---

## Fase 5 — Tests y documentación (1-2 h) — ✅ COMPLETADA (parcial)

- [x] `tests/guardrails.test.ts`:
  - [x] Test 1: prompt injection → bloqueado (múltiples variantes ES + EN).
  - [x] Test 2: query out-of-scope → redirigida (scope lock, array vacío).
  - [x] Test 3: respuesta sin citas → reemplazada por canned.
- [ ] `tests/retrieval.test.ts`:
  - [ ] Test 1: query in-scope → devuelve chunks relevantes.
  - [ ] Test 2: query out-of-scope → devuelve score bajo.
- [x] Completar `docs/architecture.md` con diagrama de capas.
- [x] Completar `docs/guardrails.md` con patrones, umbrales y ejemplos.

**Criterio de hecho:** `npm test` verde, docs leíbles por un tercero.

---

## Fase 6 — Demo y entrega (30 min)

- [ ] Grabar clip corto (2-3 min):
  1. Pregunta in-scope respondida con cita.
  2. Pregunta out-of-scope rechazada.
  3. Prompt injection bloqueado.
- [ ] Commit inicial limpio (Conventional Commits).
- [ ] Push al repo que pida la academia (propio o del curso).

**Criterio de hecho:** PR/entrega abierto con link al clip y README.

---

## Estimación total

| Fase | Tiempo |
|------|--------|
| 0 | 0.5 h ✅ |
| 1 | 1.5 h ✅ |
| 2 | 2 h ✅ |
| 3 | 2.5 h ✅ |
| 4 | 1 h ✅ |
| 5 | 1.5 h ✅ (parcial — retrieval tests pendientes) |
| 6 | 0.5 h |
| **Total** | **~9.5 h** |

Realista para una semana del curso.
