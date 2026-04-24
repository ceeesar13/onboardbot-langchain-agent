import { config } from "dotenv";
import { z } from "zod";

config({ path: ".env" });
config({ path: "env.local" });

const envSchema = z.object({
  OPENROUTER_API_KEY: z.string().min(1, "OPENROUTER_API_KEY is required"),
  OPENROUTER_MODEL: z.string().default("openai/gpt-4o-mini"),
  OPENROUTER_BASE_URL: z.string().url().default("https://openrouter.ai/api/v1"),
  OPENROUTER_TEMPERATURE: z.coerce.number().min(0).max(2).default(0),
  OPENROUTER_HTTP_REFERER: z.string().optional(),
  OPENROUTER_APP_TITLE: z.string().optional(),

  EMBEDDINGS_MODEL: z.string().default("text-embedding-3-small"),
  EMBEDDINGS_BASE_URL: z.string().url().default("https://api.openai.com/v1"),
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required for embeddings"),

  CORPUS_PATH: z.string().default("../10X-Builders-langchain-agent"),
  INDEX_PATH: z.string().default(".index"),
  RETRIEVAL_TOP_K: z.coerce.number().int().positive().default(4),
  RETRIEVAL_SCORE_THRESHOLD: z.coerce.number().min(0).max(1).default(0.3),

  GUARDRAIL_MAX_INPUT_CHARS: z.coerce.number().int().positive().default(2000),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid environment configuration:");
    for (const issue of parsed.error.issues) {
      console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }
  return parsed.data;
}
