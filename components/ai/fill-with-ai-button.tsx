"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import type { AiField } from "@/lib/types";

interface FillWithAiButtonProps {
  projectId?: string;
  projectName?: string;
  field: AiField;
  currentValue?: string;
  onComplete: (value: string) => void;
  className?: string;
}

export function FillWithAiButton({
  projectId,
  projectName,
  field,
  currentValue,
  onComplete,
  className,
}: FillWithAiButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (!projectId && !projectName) {
      setError("Enter a project name or description first");
      return;
    }

    setIsLoading(true);
    setError(null);

    const body: Record<string, string> = { field };
    if (projectId) body.project_id = projectId;
    if (projectName) body.project_name = projectName;
    if (currentValue) body.current_value = currentValue;

    const res = await fetch("/api/ai/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setIsLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to generate");
      return;
    }

    const { completion } = await res.json();
    onComplete(completion);
  }

  return (
    <div className={className}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        disabled={isLoading}
        className="gap-1.5 text-muted-foreground hover:text-foreground"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {isLoading ? "Generating..." : "Fill with AI"}
      </Button>
      {error && <p className="text-sm text-destructive mt-1">{error}</p>}
    </div>
  );
}