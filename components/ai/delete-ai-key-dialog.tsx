"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import type { UserAiKey } from "@/lib/types";

interface DeleteAiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aiKey: UserAiKey;
  onSuccess: () => void;
}

export function DeleteAiKeyDialog({
  open,
  onOpenChange,
  aiKey,
  onSuccess,
}: DeleteAiKeyDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleDelete() {
    setIsLoading(true);

    const res = await fetch(`/api/ai/keys/${aiKey.id}`, {
      method: "DELETE",
    });

    setIsLoading(false);

    if (res.ok) {
      onOpenChange(false);
      onSuccess();
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete AI Key</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the &quot;{aiKey.name}&quot; key for {aiKey.provider}? This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}