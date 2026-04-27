import OpenAI from "openai";
import { decrypt } from "@/lib/encryption";
import { buildPrompt } from "./prompts";
import type { AiField, UserAiKeyWithSecret } from "@/lib/types";

interface AiCompleteOptions {
  apiKey: UserAiKeyWithSecret;
  field: AiField;
  projectName: string;
  currentValue?: string;
}

const MODEL_BY_PROVIDER: Record<string, string> = {
  openai: "gpt-4o-mini",
  deepseek: "deepseek-v4-flash",
};

const BASE_URL_BY_PROVIDER: Record<string, string | undefined> = {
  deepseek: "https://api.deepseek.com",
};

export async function aiComplete(options: AiCompleteOptions): Promise<string> {
  const { apiKey, field, projectName, currentValue } = options;

  const decryptedKey = decrypt(apiKey.encrypted_value);

  const client = new OpenAI({
    apiKey: decryptedKey,
    baseURL: BASE_URL_BY_PROVIDER[apiKey.provider],
  });

  const prompt = buildPrompt(field, projectName, currentValue);

  const model = MODEL_BY_PROVIDER[apiKey.provider] || "gpt-4o-mini";

  const response = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    max_tokens: 500,
    temperature: 0.7,
  });

  const completion = response.choices[0]?.message?.content;

  if (!completion) {
    throw new Error("No completion returned from AI provider");
  }

  return completion.trim();
}