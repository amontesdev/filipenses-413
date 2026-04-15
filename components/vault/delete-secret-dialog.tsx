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

interface SecretWithProject {
  id: string;
  name: string;
  projects: { name: string } | null;
}

interface DeleteSecretDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  secret: SecretWithProject;
  onSuccess: () => void;
}

export function DeleteSecretDialog({ 
  open, 
  onOpenChange, 
  secret, 
  onSuccess 
}: DeleteSecretDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleDelete() {
    setIsLoading(true);

    const res = await fetch(`/api/secrets/${secret.id}`, {
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
          <AlertDialogTitle>Delete Secret</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{secret.name}&quot;? This action cannot be undone
            and the encrypted value will be permanently removed.
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
