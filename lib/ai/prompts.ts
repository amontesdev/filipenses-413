import type { AiField } from "@/lib/types";

export function buildPrompt(field: AiField, projectName: string, currentValue?: string): string {
  if (field === "name") {
    return `You are a creative project naming assistant. Given a brief description or context, generate a concise, memorable project name (1-5 words).

Context: "${projectName}"

Output ONLY the project name. No quotes, no explanation, no commentary.`;
  }

  if (field === "description") {
    return `You are a professional project manager. Given the project name below, generate a concise, professional project description (1-3 sentences).

Project name: "${projectName}"

Output ONLY the description text. No markdown, no commentary, no prefixes.`;
  }

  if (field === "notes") {
    const context = currentValue
      ? `Current notes:\n${currentValue}\n\n`
      : "";

    return `You are a professional project manager. Given the project name and any existing notes below, improve and expand the notes while maintaining their structure. Keep the same format (bullet points, headings, etc. if present).

Project name: "${projectName}"
${context}
Output ONLY the improved notes content in plain text. No markdown, no commentary, no prefixes.`;
  }

  throw new Error(`Unknown field: ${field}`);
}