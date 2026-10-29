"use client";

import { useRef, useState, useTransition } from "react";
import { Upload } from "lucide-react";
import { uploadTabFileAction } from "@/app/actions";
import { Button } from "@/components/ui/button";

const ACCEPT = ".gp,.gp3,.gp4,.gp5,.gpx,.gpb,.xml,.musicxml,.tex,.alphatex,.txt";

export function UploadTabButton({
  trackId,
  instrument = "guitar",
}: {
  trackId: string;
  instrument?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save(selected: File) {
    const data = new FormData();
    data.set("trackId", trackId);
    data.set("instrument", instrument);
    data.set("file", selected);
    setError(null);
    startTransition(async () => {
      const result = await uploadTabFileAction(data);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="grid gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(event) => {
          const next = event.target.files?.[0] ?? null;
          setFile(next);
        }}
      />
      {file ? (
        <div className="flex h-16 items-center gap-2 rounded-lg bg-muted px-3 ring-1 ring-border">
          <button
            type="button"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
            className="min-w-0 flex-1 truncate text-left text-sm font-medium text-foreground"
            title={`${file.name} — tap to choose a different file`}
          >
            {file.name}
          </button>
          <Button
            type="button"
            size="sm"
            disabled={pending}
            className="h-11 shrink-0 bg-gold px-4 text-black hover:bg-gold/90"
            onClick={() => save(file)}
          >
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          size="lg"
          variant="outline"
          className="h-16 border-border text-lg"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
        >
          <Upload />
          Upload tab
        </Button>
      )}
      {error ? <p className="text-left text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
