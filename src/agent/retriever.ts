import { OpenAIEmbeddings } from "@langchain/openai";
import { HNSWLib } from "@langchain/community/vectorstores/hnswlib";
import type { Env } from "../config/env.js";

export interface RetrievedChunk {
  content: string;
  source: string;
  score: number;
}

export interface Retriever {
  retrieve(query: string, k?: number): Promise<RetrievedChunk[]>;
}

export async function createRetriever(env: Env): Promise<Retriever> {
  const embeddings = new OpenAIEmbeddings({
    model: env.EMBEDDINGS_MODEL,
    apiKey: env.OPENAI_API_KEY,
    configuration: { baseURL: env.EMBEDDINGS_BASE_URL },
  });

  let store: HNSWLib;
  try {
    store = await HNSWLib.load(env.INDEX_PATH, embeddings);
  } catch {
    throw new Error(
      `Índice no encontrado en '${env.INDEX_PATH}'. Ejecutá primero: npm run ingest -- <ruta-al-corpus>`
    );
  }

  return {
    async retrieve(query: string, k?: number): Promise<RetrievedChunk[]> {
      const results = await store.similaritySearchWithScore(
        query,
        k ?? env.RETRIEVAL_TOP_K
      );

      return results.map(([doc, distance]) => ({
        content: doc.pageContent,
        source: (doc.metadata.source as string | undefined) ?? "unknown",
        // HNSWLib returns L2 distance (lower = closer); convert to similarity in [0,1]
        score: Math.max(0, Math.min(1, 1 - distance)),
      }));
    },
  };
}
