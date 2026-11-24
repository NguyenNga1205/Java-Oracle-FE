"use client";

import * as React from "react";
import { FileSpreadsheet, UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/utils";

type DropzoneProps = {
  file: File | null;
  onFile: (file: File | null) => void;
  accept?: string;
  title?: string;
  hint?: string;
  disabled?: boolean;
};

/** Drag-and-drop file chooser. Replaces the native file input. */
export function Dropzone({ file, onFile, accept = ".xlsx", title = "Kéo thả file vào đây", hint, disabled }: DropzoneProps) {
  const ref = React.useRef<HTMLInputElement>(null);
  const [over, setOver] = React.useState(false);
  const exts = accept.split(",").map((s) => s.trim().toLowerCase());
  const accepts = (f: File) => exts.some((e) => f.name.toLowerCase().endsWith(e));

  return (
    <div
      role="button"
      tabIndex={0}
      aria-disabled={disabled}
      onClick={() => !disabled && ref.current?.click()}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !disabled) {
          e.preventDefault();
          ref.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f && accepts(f) && !disabled) onFile(f);
      }}
      className={cn(
        "group flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors outline-none",
        "focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px]",
        over ? "border-primary bg-primary/10" : "border-input hover:border-primary/60 hover:bg-secondary/40",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          onFile(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
      {file ? (
        <div className="flex items-center gap-3">
          <span className="bg-success/15 text-success grid size-10 place-items-center rounded-lg">
            <FileSpreadsheet className="size-5" />
          </span>
          <div className="text-left">
            <p className="text-sm font-semibold">{file.name}</p>
            <p className="text-muted-foreground text-xs">{(file.size / 1024).toFixed(1)} KB · bấm để chọn file khác</p>
          </div>
          <button
            type="button"
            aria-label="Bỏ file"
            onClick={(e) => {
              e.stopPropagation();
              onFile(null);
            }}
            className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-md p-1.5"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <>
          <span className="bg-primary/15 text-primary grid size-12 place-items-center rounded-full">
            <UploadCloud className="size-6" />
          </span>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-muted-foreground text-xs">{hint ?? "hoặc bấm để chọn file từ máy tính"}</p>
        </>
      )}
    </div>
  );
}
