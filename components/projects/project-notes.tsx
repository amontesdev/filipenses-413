"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { TiptapEditor } from "@/components/editor/tiptap-editor";
import { FillWithAiButton } from "@/components/ai/fill-with-ai-button";
import type { JSONContent } from "@tiptap/react";

interface ProjectNotesProps {
  projectId: string;
  initialContent: unknown;
  onSave: () => void;
}

export function ProjectNotes({ projectId, initialContent, onSave }: ProjectNotesProps) {
  const [content, setContent] = useState<JSONContent | null>(
    initialContent as JSONContent | null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = useCallback((newContent: JSONContent) => {
    setContent(newContent);
    setHasChanges(true);
  }, []);

  async function handleSave() {
    setIsSaving(true);

    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: content }),
    });

    setIsSaving(false);

    if (res.ok) {
      setHasChanges(false);
      onSave();
    }
  }

  return (
    <div className="space-y-4">
      <TiptapEditor
        content={content}
        onChange={handleChange}
        placeholder="Write your project notes here..."
      />
      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={isSaving || !hasChanges} size="sm">
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Notes
        </Button>
        <FillWithAiButton
          projectId={projectId}
          field="notes"
          onComplete={(value) => {
            setContent({ type: "text", text: value });
            setHasChanges(true);
          }}
          className="ml-auto"
        />
        {hasChanges && (
          <span className="text-xs text-muted-foreground">Unsaved changes</span>
        )}
      </div>
    </div>
  );
}
