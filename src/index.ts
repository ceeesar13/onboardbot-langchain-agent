import readline from "node:readline";
import { loadEnv } from "./config/env.js";
import { createAgent } from "./agent/createAgent.js";

async function main(): Promise<void> {
  const env = loadEnv();

  console.log("OnboardBot — RAG onboarding assistant");
  console.log(`Corpus: ${env.CORPUS_PATH}`);
  console.log(`Index:  ${env.INDEX_PATH}`);
  console.log("Type /help for commands, /exit to quit.\n");

  const agent = await createAgent(env);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "> ",
  });

  let lastSources: string[] = [];

  rl.prompt();

  rl.on("line", async (line) => {
    const input = line.trim();

    if (input === "/exit" || input === "/quit") {
      rl.close();
      return;
    }
    if (input === "/help") {
      console.log("/help    Muestra esta ayuda");
      console.log("/sources Muestra las fuentes de la última respuesta");
      console.log("/reset   Limpia el estado de conversación (no implementado aún)");
      console.log("/exit    Salir");
      rl.prompt();
      return;
    }
    if (input === "/sources") {
      if (lastSources.length === 0) {
        console.log("(sin fuentes — hacé una pregunta primero)");
      } else {
        console.log("Fuentes:");
        for (const s of lastSources) {
          console.log(`  - ${s}`);
        }
      }
      rl.prompt();
      return;
    }
    if (input.length === 0) {
      rl.prompt();
      return;
    }

    try {
      const response = await agent.ask(input);

      if (response.blocked) {
        console.log(`[bloqueado: ${response.blocked.reason}] ${response.blocked.message}`);
      } else {
        console.log(response.answer);
        if (response.sources.length > 0) {
          console.log("\nFuentes:");
          for (const s of response.sources) {
            console.log(`  - ${s}`);
          }
        }
      }

      lastSources = response.sources;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error: ${message}`);
    }

    rl.prompt();
  });

  rl.on("close", () => {
    console.log("\nBye.");
    process.exit(0);
  });

  process.on("SIGINT", () => {
    rl.close();
  });
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
