"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Plus } from "lucide-react";
import useSWR from "swr";
import { AiKeysList } from "@/components/ai/ai-keys-list";
import { AddAiKeyDialog } from "@/components/ai/add-ai-key-dialog";
import type { UserAiKey, AiProvider } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

async function fetchProfile() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
    
  if (error) throw error;
  return { profile: data, user };
}

export default function SettingsPage() {
  const router = useRouter();
  const { data, error, mutate } = useSWR("profile", fetchProfile);
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  async function fetchAiKeys(): Promise<{ keys: UserAiKey[] }> {
    const res = await fetch("/api/ai/keys");
    if (!res.ok) throw new Error("Failed to fetch AI keys");
    return res.json();
  }

  async function fetchAiPreferences(): Promise<{ preferred_provider: string }> {
    const res = await fetch("/api/ai/preferences");
    if (!res.ok) return { preferred_provider: "openai" };
    return res.json();
  }

  const { data: aiKeysData, mutate: mutateAiKeys } = useSWR("ai-keys", fetchAiKeys);
  const { data: prefsData, mutate: mutatePrefs } = useSWR("ai-preferences", fetchAiPreferences);

  async function handleProviderChange(value: AiProvider) {
    await fetch("/api/ai/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferred_provider: value }),
    });
    mutatePrefs();
  }

  const preferredProvider = prefsData?.preferred_provider || "openai";

  // Initialize display name when data loads
  if (data?.profile && !displayName && data.profile.display_name) {
    setDisplayName(data.profile.display_name);
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", data?.user.id);

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Profile updated successfully" });
      mutate();
      router.refresh();
    }

    setIsLoading(false);
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load settings</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Profile</CardTitle>
          <CardDescription>Manage your profile information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={data?.user.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Your email is managed through GitHub
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
              />
            </div>

            {message && (
              <div className={`text-sm ${message.type === "success" ? "text-emerald-400" : "text-destructive"}`}>
                {message.text}
              </div>
            )}

            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Account</CardTitle>
          <CardDescription>Manage your account settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-foreground mb-2">Connected Account</h3>
            <div className="flex items-center gap-3 p-3 rounded-md bg-muted">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span className="text-sm text-foreground">GitHub</span>
              <span className="ml-auto text-xs text-muted-foreground">Connected</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-foreground">AI Providers</CardTitle>
              <CardDescription>
                Connect your API keys to enable AI-assisted project field filling
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Preferred Provider</Label>
            <Select
              value={preferredProvider}
              onValueChange={handleProviderChange}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="deepseek">DeepSeek</SelectItem>
                <SelectItem value="ollama">Ollama (Local)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              This provider will be used for AI field filling
            </p>
          </div>

          <AiKeysList
            keys={aiKeysData?.keys || []}
            onUpdate={mutateAiKeys}
          />
          <Button variant="outline" onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add AI Key
          </Button>
        </CardContent>
      </Card>

      <AddAiKeyDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={() => {
          mutateAiKeys();
          setAddDialogOpen(false);
        }}
      />
    </div>
  );
}
