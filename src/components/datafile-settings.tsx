"use client";

import { useRef, useState } from "react";
import { Upload, FileCheck, AlertCircle } from "lucide-react";
import { parseDataFile } from "@/lib/parse-datafile";
import { useSprites } from "@/store/sprite-context";

interface DataFileSettingsProps {
  fileName: string;
}

export function DataFileSettings({ fileName }: DataFileSettingsProps) {
  const { dispatch } = useSprites();
  const inputRef = useRef<HTMLInputElement>(null);

  const [parsedCount, setParsedCount] = useState<number | null>(null);
  const [parsedFileName, setParsedFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const sprites = parseDataFile(content, fileName);
      dispatch({ type: "SET_SPRITES", sprites });
      setParsedCount(sprites.length);
      setParsedFileName(file.name);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse file");
      setParsedCount(null);
      setParsedFileName(null);
      dispatch({ type: "SET_SPRITES", sprites: [] });
    }

    // Reset input so the same file can be re-uploaded
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-foreground">Data File Import</h3>
      <p className="text-xs text-muted-foreground">
        匯入現有的 atlas 資料檔（plist / JSON），直接載入切割定義。
      </p>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept=".json,.xml,.plist"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Upload button */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
      >
        <Upload className="size-4" />
        Choose Data File
      </button>

      {/* Success message */}
      {parsedCount !== null && (
        <div className="flex items-start gap-2 rounded-md bg-green-500/10 p-3 text-xs text-green-600 dark:text-green-400">
          <FileCheck className="mt-0.5 size-3.5 shrink-0" />
          <div>
            <p className="font-medium">
              Parsed {parsedCount} sprite{parsedCount !== 1 ? "s" : ""}
            </p>
            {parsedFileName && (
              <p className="mt-0.5 text-green-600/70 dark:text-green-400/70">
                from {parsedFileName}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Supported formats */}
      <div className="text-xs text-muted-foreground">
        <p className="mb-1 font-medium">Supported formats:</p>
        <ul className="list-inside list-disc space-y-0.5">
          <li>TexturePacker JSON (hash / array)</li>
          <li>Cocos Creator plist (XML)</li>
        </ul>
      </div>
    </div>
  );
}
