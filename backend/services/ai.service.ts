import { groq } from "../config/groq";

const AI_SYSTEM_PROMPT = `You are FlowBot, an intelligent AI assistant embedded in FlowTalk — a realtime chat application.
Your role is to help users with their questions, summarize conversations, draft messages, explain concepts, and more.
Be concise, friendly, and helpful. Format responses with markdown when helpful.`;

/**
 * Ask Groq LLM a question and get a full response.
 * Uses llama-3.3-70b-versatile — fast, capable, and available on Groq's free tier.
 */
export const askGroq = async (prompt: string, context?: string): Promise<string> => {
  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: AI_SYSTEM_PROMPT },
  ];

  if (context) {
    messages.push({
      role: "user",
      content: `Context from the conversation:\n${context}`,
    });
    messages.push({
      role: "assistant",
      content: "I've reviewed the conversation context. How can I help?",
    });
  }

  messages.push({ role: "user", content: prompt });

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages,
    max_tokens: 1024,
    temperature: 0.7,
  });

  const text = completion.choices[0]?.message?.content;
  if (!text) throw new Error("Empty response from Groq");
  return text;
};
