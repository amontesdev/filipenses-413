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
import { Eye, EyeOff, Copy, MoreHorizontal, Trash2, Check, KeyRound, Loader2 } from "lucide-react";
import { DeleteSecretDialog } from "./delete-secret-dialog";

interface SecretWithProject {
  id: string;
  project_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  projects: { name: string } | null;
}

interface SecretsListProps {
  secrets: SecretWithProject[];
  onUpdate: () => void;
}

export function SecretsList({ secrets, onUpdate }: SecretsListProps) {
  return (
    <div className="space-y-3">
      {secrets.map((secret) => (
        <SecretItem key={secret.id} secret={secret} onUpdate={onUpdate} />
      ))}
    </div>
  );
}

function SecretItem({ 
  secret, 
  onUpdate 
}: { 
  secret: SecretWithProject; 
  onUpdate: () => void;
}) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [decryptedValue, setDecryptedValue] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  async function handleReveal() {
    if (isRevealed) {
      setIsRevealed(false);
      setDecryptedValue(null);
      return;
    }

    setIsLoading(true);
    
    const res = await fetch(`/api/secrets/${secret.id}`);
    if (res.ok) {
      const data = await res.json();
      setDecryptedValue(data.secret.value);
      setIsRevealed(true);
    }

    setIsLoading(false);
  }

  async function handleCopy() {
    if (!decryptedValue) {
      // First fetch the value
      const res = await fetch(`/api/secrets/${secret.id}`);
      if (res.ok) {
        const data = await res.json();
        await navigator.clipboard.writeText(data.secret.value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } else {
      await navigator.clipboard.writeText(decryptedValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <>
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
              <KeyRound className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-foreground truncate">{secret.name}</h3>
                <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
                  {secret.projects?.name || "Unknown Project"}
                </span>
              </div>
              
              <div className="flex items-center gap-2 mt-1">
                {isRevealed && decryptedValue ? (
                  <code className="text-sm text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded max-w-md truncate">
                    {decryptedValue}
                  </code>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    ••••••••••••••••
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleReveal}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isRevealed ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                <span className="sr-only">{isRevealed ? "Hide" : "Reveal"}</span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="sr-only">Copy</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">More options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleCopy}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Value
                  </DropdownMenuItem>
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
          </div>
        </CardContent>
      </Card>

      <DeleteSecretDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        secret={secret}
        onSuccess={onUpdate}
      />
    </>
  );
}
