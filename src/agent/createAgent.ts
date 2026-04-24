import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { MessageContentComplex } from "@langchain/core/messages";
import type { Env } from "../config/env.js";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompt.js";
import { createRetriever } from "./retriever.js";
import { validateInput } from "./guardrails/inputValidator.js";
import { validateOutput } from "./guardrails/outputValidator.js";
import { isOutOfScope } from "./guardrails/scopeLock.js";

export interface Agent {
  ask(question: string): Promise<AgentResponse>;
}

export type BlockedReason =
  | "prompt-injection"
  | "out-of-scope"
  | "empty-retrieval"
  | "input-too-long"
  | "no-citations"
  | "invalid-source";

export interface AgentResponse {
  answer: string;
  sources: string[];
  blocked?: {
    reason: BlockedReason;
    message: string;
  };
}

export async function createAgent(env: Env): Promise<Agent> {
  const retriever = await createRetriever(env);

  const llm = new ChatOpenAI({
    model: env.OPENROUTER_MODEL,
    temperature: env.OPENROUTER_TEMPERATURE,
    apiKey: env.OPENROUTER_API_KEY,
    configuration: {
      baseURL: env.OPENROUTER_BASE_URL,
      defaultHeaders: {
        "HTTP-Referer": env.OPENROUTER_HTTP_REFERER ?? "",
        "X-Title": env.OPENROUTER_APP_TITLE ?? "OnboardBot",
      },
    },
  });

  return {
    async ask(question: string): Promise<AgentResponse> {
      const inputCheck = validateInput(question, env.GUARDRAIL_MAX_INPUT_CHARS);
      if (!inputCheck.ok) {
        return {
          answer: inputCheck.message,
          sources: [],
          blocked: { reason: inputCheck.reason, message: inputCheck.message },
        };
      }

      const chunks = await retriever.retrieve(question);

      if (isOutOfScope(chunks.map((c) => c.score), env.RETRIEVAL_SCORE_THRESHOLD)) {
        const message =
          "Tu pregunta parece fuera del alcance de este asistente. Solo respondo sobre el repositorio cargado. ¿Puedo ayudarte con algo del proyecto?";
        return {
          answer: message,
          sources: [],
          blocked: { reason: "out-of-scope", message },
        };
      }

      const context = chunks
        .map((c) => `[fuente: ${c.source}]\n${c.content}`)
        .join("\n\n---\n\n");

      const userPrompt = buildUserPrompt(question, context);

      const result = await llm.invoke([
        new SystemMessage(SYSTEM_PROMPT),
        new HumanMessage(userPrompt),
      ]);

      // result.content can be string or array of content parts — coerce to string
      const answer =
        typeof result.content === "string"
          ? result.content
          : (result.content as MessageContentComplex[])
              .map((part) => ("text" in part ? part.text : ""))
              .join("");

      const seen = new Set<string>();
      const sources: string[] = [];
      for (const c of chunks) {
        if (!seen.has(c.source)) {
          seen.add(c.source);
          sources.push(c.source);
        }
      }

      const outputCheck = validateOutput(answer, sources);
      if (!outputCheck.ok) {
        return {
          answer: outputCheck.cleaned,
          sources: [],
          blocked: {
            reason: outputCheck.reason ?? "no-citations",
            message: outputCheck.cleaned,
          },
        };
      }

      return { answer: outputCheck.cleaned, sources };
    },
  };
}
