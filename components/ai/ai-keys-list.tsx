"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, Sparkles, Loader2 } from "lucide-react";
import { DeleteAiKeyDialog } from "./delete-ai-key-dialog";
import type { UserAiKey } from "@/lib/types";

interface AiKeysListProps {
  keys: UserAiKey[];
  onUpdate: () => void;
}

export function AiKeysList({ keys, onUpdate }: AiKeysListProps) {
  if (keys.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No AI keys configured. Add a key to enable AI-assisted field filling.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {keys.map((key) => (
        <AiKeyItem key={key.id} keyItem={key} onUpdate={onUpdate} />
      ))}
    </div>
  );
}

function AiKeyItem({
  keyItem,
  onUpdate,
}: {
  keyItem: UserAiKey;
  onUpdate: () => void;
}) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const providerLabels: Record<string, string> = {
    openai: "OpenAI",
    anthropic: "Anthropic",
    google: "Google",
    deepseek: "DeepSeek",
  };

  return (
    <>
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
              <Sparkles className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-foreground truncate">
                  {providerLabels[keyItem.provider] || keyItem.provider}
                </h3>
                <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
                  {keyItem.name}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Added {new Date(keyItem.created_at).toLocaleDateString()}
              </p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">More options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      <DeleteAiKeyDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        aiKey={keyItem}
        onSuccess={onUpdate}
      />
    </>
  );
}