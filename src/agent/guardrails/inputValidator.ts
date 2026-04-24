import { INJECTION_PATTERNS } from "./patterns.js";

export type InputValidationResult =
  | { ok: true }
  | { ok: false; reason: "prompt-injection" | "input-too-long"; message: string };

export function validateInput(input: string, maxChars: number): InputValidationResult {
  // Trim before length check so leading/trailing whitespace doesn't inflate the count
  const trimmed = input.trim();

  if (trimmed.length > maxChars) {
    return {
      ok: false,
      reason: "input-too-long",
      message:
        "El mensaje supera el límite máximo de caracteres permitido. Acortá tu pregunta.",
    };
  }

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        ok: false,
        reason: "prompt-injection",
        message:
          "Detecté un intento de manipulación. ¿En qué tema del repositorio te puedo ayudar?",
      };
    }
  }

  return { ok: true };
}
