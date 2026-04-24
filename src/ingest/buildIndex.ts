import fs from "node:fs/promises";
import path from "node:path";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { HNSWLib } from "@langchain/community/vectorstores/hnswlib";
import { loadEnv } from "../config/env.js";

// Directories that pollute the corpus with non-documentation content.
const EXCLUDED_DIRS = new Set(["node_modules", ".index", "dist", ".git", "coverage"]);

async function walkMarkdown(dir: string): Promise<string[]> {
  const results: string[] = [];

  async function recurse(current: string): Promise<void> {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!EXCLUDED_DIRS.has(entry.name)) {
          await recurse(path.join(current, entry.name));
        }
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        results.push(path.join(current, entry.name));
      }
    }
  }

  await recurse(dir);
  return results;
}

async function main(): Promise<void> {
  const env = loadEnv();
  const targetPath = path.resolve(process.argv[2] ?? env.CORPUS_PATH);
  const start = Date.now();

  console.log(`[ingest] Target corpus: ${targetPath}`);

  // Fail fast if path doesn't exist instead of a confusing downstream error.
  try {
    await fs.access(targetPath);
  } catch {
    console.error(`[ingest] Fatal: path does not exist — ${targetPath}`);
    process.exit(1);
  }

  const files = await walkMarkdown(targetPath);
  console.log(`[ingest] Found ${files.length} .md file(s)`);

  if (files.length === 0) {
    console.error("[ingest] Fatal: no .md files found in corpus — nothing to index.");
    process.exit(1);
  }

  const docs: Document[] = [];
  for (const filePath of files) {
    const content = await fs.readFile(filePath, "utf-8");
    if (content.trim().length === 0) continue;
    docs.push(
      new Document({
        pageContent: content,
        metadata: { source: path.relative(targetPath, filePath) },
      }),
    );
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });
  const chunks = await splitter.splitDocuments(docs);
  console.log(`[ingest] ${chunks.length} chunk(s) produced`);

  const embeddings = new OpenAIEmbeddings({
    model: env.EMBEDDINGS_MODEL,
    apiKey: env.OPENAI_API_KEY,
    configuration: { baseURL: env.EMBEDDINGS_BASE_URL },
  });

  const store = await HNSWLib.fromDocuments(chunks, embeddings);
  await store.save(env.INDEX_PATH);

  const elapsed = ((Date.now() - start) / 1000).toFixed(2);
  console.log(`[ingest] Elapsed: ${elapsed}s`);
  console.log(`[ingest] Index saved to ${env.INDEX_PATH}`);
}

main().catch((err: unknown) => {
  console.error("[ingest] Fatal:", err);
  process.exit(1);
});
