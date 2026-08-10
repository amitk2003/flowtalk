import Groq from "groq-sdk";
import { env } from "./env";

/**
 * Shared Groq SDK client instance.
 * Used by ai.service.ts for all LLM calls.
 */
export const groq = new Groq({
  apiKey: env.GROQ_API_KEY,
});
