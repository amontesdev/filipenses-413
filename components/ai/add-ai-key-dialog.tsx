"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Sparkles } from "lucide-react";
import type { AiProvider } from "@/lib/types";

interface AddAiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CLOUD_PROVIDERS: { value: AiProvider; label: string }[] = [
  { value: "openai", label: "OpenAI" },
  { value: "deepseek", label: "DeepSeek" },
];

const LOCAL_PROVIDERS: { value: AiProvider; label: string }[] = [
  { value: "ollama", label: "Ollama (Local)" },
];

export function AddAiKeyDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddAiKeyDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocalProvider, setIsLocalProvider] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [formData, setFormData] = useState({
    provider: "openai" as AiProvider,
    name: "default",
    value: "",
    model_name: "",
  });

  // When provider changes, check if it's local
  useEffect(() => {
    const local = LOCAL_PROVIDERS.some((p) => p.value === formData.provider);
    setIsLocalProvider(local);

    if (local) {
      // Reset value when switching to local
      setFormData((f) => ({ ...f, value: "" }));
    }
  }, [formData.provider]);

  // Fetch available models when dialog opens with ollama selected
  useEffect(() => {
    if (open && formData.provider === "ollama") {
      fetchModels();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function fetchModels() {
    setModelsLoading(true);
    try {
      const res = await fetch("/api/ai/ollama/models");
      if (res.ok) {
        const data = await res.json();
        setAvailableModels(data.models.map((m: { name: string }) => m.name));
      }
    } catch {
      // Ignore errors fetching models
    }
    setModelsLoading(false);
  }

  function handleProviderChange(value: AiProvider) {
    setFormData((f) => ({
      ...f,
      provider: value,
      value: "",
      model_name: "",
    }));
    setError(null);

    if (value === "ollama") {
      fetchModels();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const body: Record<string, string> = {
      provider: formData.provider,
      name: formData.name,
    };

    if (formData.provider === "ollama") {
      body.model_name = formData.model_name;
    } else {
      body.value = formData.value;
    }

    const res = await fetch("/api/ai/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to add key");
      setIsLoading(false);
      return;
    }

    setFormData({ provider: "openai", name: "default", value: "", model_name: "" });
    setIsLoading(false);
    onSuccess();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Add AI Provider</DialogTitle>
              <DialogDescription>
                {isLocalProvider
                  ? "Configure a local AI provider. No API key needed."
                  : "Store your AI API key securely with AES-256 encryption."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <Select
              value={formData.provider}
              onValueChange={handleProviderChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLOUD_PROVIDERS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
                <SelectItem value="ollama-separator" disabled>
                  ── Local ──
                </SelectItem>
                {LOCAL_PROVIDERS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((f) => ({ ...f, name: e.target.value }))
              }
              placeholder="default"
            />
            <p className="text-xs text-muted-foreground">
              A label to identify this provider
            </p>
          </div>

          {isLocalProvider ? (
            <div className="space-y-2">
              <Label htmlFor="model_name">Model</Label>
              <Select
                value={formData.model_name}
                onValueChange={(v) =>
                  setFormData((f) => ({ ...f, model_name: v }))
                }
              >
                <SelectTrigger>
                  {modelsLoading ? (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading models...
                    </span>
                  ) : (
                    <SelectValue placeholder="Select a model" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {availableModels.length === 0 && !modelsLoading && (
                    <SelectItem value="__empty__" disabled>
                      No models found. Run `ollama pull modelo` first.
                    </SelectItem>
                  )}
                  {availableModels.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Make sure Ollama is running and you have models downloaded.{" "}
                <button
                  type="button"
                  className="underline"
                  onClick={fetchModels}
                >
                  Refresh
                </button>
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="value">API Key *</Label>
              <Input
                id="value"
                type="password"
                value={formData.value}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, value: e.target.value }))
                }
                placeholder="sk-..."
                required
              />
              <p className="text-xs text-muted-foreground">
                Your key will be encrypted with AES-256 before storage
              </p>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading ||
                (!isLocalProvider && !formData.value) ||
                (isLocalProvider && !formData.model_name)
              }
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Provider
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}