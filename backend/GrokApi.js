import OpenAI from "openai";

const Grok = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: "https://api.x.ai/v1",
});

const response = Grok.responses.create({
  model: "grok-2-latest",
  input: "write a haiku about ai",
});

response.then(r => console.log(r.output_text));
export default Grok
