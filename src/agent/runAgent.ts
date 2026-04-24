import type { Agent, AgentResponse } from "./createAgent.js";

export async function runAgent(agent: Agent, question: string): Promise<AgentResponse> {
  return agent.ask(question);
}
