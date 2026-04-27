"use client";

import { useState } from "react";
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

const PROVIDERS: { value: AiProvider; label: string }[] = [
  { value: "openai", label: "OpenAI" },
  { value: "deepseek", label: "DeepSeek" },
];

export function AddAiKeyDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddAiKeyDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    provider: "openai" as AiProvider,
    name: "default",
    value: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const res = await fetch("/api/ai/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to add key");
      setIsLoading(false);
      return;
    }

    setFormData({ provider: "openai", name: "default", value: "" });
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
              <DialogTitle>Add AI Key</DialogTitle>
              <DialogDescription>
                Store your AI API key securely with AES-256 encryption
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <Select
              value={formData.provider}
              onValueChange={(value: AiProvider) =>
                setFormData({ ...formData, provider: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVIDERS.map((p) => (
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
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="default"
            />
            <p className="text-xs text-muted-foreground">
              A label to identify this key
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">API Key *</Label>
            <Input
              id="value"
              type="password"
              value={formData.value}
              onChange={(e) =>
                setFormData({ ...formData, value: e.target.value })
              }
              placeholder="sk-..."
              required
            />
            <p className="text-xs text-muted-foreground">
              Your key will be encrypted with AES-256 before storage
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.value}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Key
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}