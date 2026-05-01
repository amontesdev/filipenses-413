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

const DEFAULT_MODEL_BY_PROVIDER: Record<string, string> = {
  openai: "gpt-4o-mini",
  deepseek: "deepseek-v4-flash",
};

const BASE_URL_BY_PROVIDER: Record<string, string | undefined> = {
  deepseek: "https://api.deepseek.com",
  ollama: "http://localhost:11434/v1",
};

// Providers that don't require an API key (local)
const LOCAL_PROVIDERS = new Set(["ollama"]);

// Timeout for local models (they load the model on first request)
const LOCAL_TIMEOUT_MS = 10 * 60 * 1000;

export async function aiComplete(options: AiCompleteOptions): Promise<string> {
  const { apiKey, field, projectName, currentValue } = options;

  // For local providers, no decryption needed
  const apiKeyValue = LOCAL_PROVIDERS.has(apiKey.provider)
    ? "local"
    : decrypt(apiKey.encrypted_value);

  const isLocal = LOCAL_PROVIDERS.has(apiKey.provider);

  const client = new OpenAI({
    apiKey: apiKeyValue,
    baseURL: BASE_URL_BY_PROVIDER[apiKey.provider],
    timeout: isLocal ? LOCAL_TIMEOUT_MS : undefined,
  });

  const prompt = buildPrompt(field, projectName, currentValue);

  // For ollama, use the model_name from the stored key (or fall back)
  const model = apiKey.model_name || DEFAULT_MODEL_BY_PROVIDER[apiKey.provider] || "gpt-4o-mini";

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