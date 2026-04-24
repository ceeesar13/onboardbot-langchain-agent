export interface OutputValidationResult {
  ok: boolean;
  cleaned: string;
  reason?: "no-citations" | "invalid-source";
}

const CITATION_REGEX = /\[fuente:\s*([^\]]+)\]/gi;
const CANNED_PHRASE = "no tengo esa información";
const CANNED_RESPONSE =
  "No tengo esa información en los documentos cargados del repositorio.";

export function validateOutput(
  answer: string,
  retrievedSources: string[],
): OutputValidationResult {
  // Canned rejection answers don't need citations — let them through unchanged
  if (answer.toLowerCase().includes(CANNED_PHRASE)) {
    return { ok: true, cleaned: answer };
  }

  const citations = [...answer.matchAll(CITATION_REGEX)].map((m) =>
    m[1].trim(),
  );

  if (citations.length === 0) {
    return { ok: false, cleaned: CANNED_RESPONSE, reason: "no-citations" };
  }

  // Substring match in both directions: "README.md" matches ".../README.md" and vice-versa
  const sourcesLower = retrievedSources.map((s) => s.toLowerCase());

  for (const cited of citations) {
    const citedLower = cited.toLowerCase();
    const matched = sourcesLower.some(
      (src) => src.includes(citedLower) || citedLower.includes(src),
    );
    if (!matched) {
      return { ok: false, cleaned: CANNED_RESPONSE, reason: "invalid-source" };
    }
  }

  return { ok: true, cleaned: answer };
}
