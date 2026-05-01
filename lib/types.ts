export type ProjectStatus = "idea" | "in_progress" | "launched" | "archived";

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  notes: unknown | null; // Tiptap JSON content
  github_url: string | null;
  live_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Secret {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  encrypted_value: string;
  created_at: string;
  updated_at: string;
}

export interface DecryptedSecret {
  id: string;
  project_id: string;
  name: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  project_id: string | null;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
  project?: {
    name: string;
  };
}

export const PROJECT_STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string }> = {
  idea: { label: "Idea", color: "bg-amber-100 text-amber-800" },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-800" },
  launched: { label: "Launched", color: "bg-emerald-100 text-emerald-800" },
  archived: { label: "Archived", color: "bg-zinc-100 text-zinc-600" },
};

export type AiProvider = "openai" | "anthropic" | "google" | "deepseek" | "ollama";

export interface UserAiKey {
  id: string;
  user_id: string;
  provider: AiProvider;
  name: string;
  model_name?: string | null;
  encrypted_value?: string;
  created_at: string;
  updated_at: string;
}

// Internal type used server-side where encrypted_value is always present
export interface UserAiKeyWithSecret extends UserAiKey {
  encrypted_value: string;
  model_name?: string;
}

export type AiField = "description" | "notes" | "name";
