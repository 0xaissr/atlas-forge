"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Download, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type { SpriteRect, ExportSettings as ExportSettingsType, ExportEngine, ExportMode } from "@/types";
import { downloadAtlas } from "@/lib/export-download";
import { maxRectsPack, findBestFitSize } from "@/lib/bin-pack";

export interface RepackPreview {
  image: HTMLImageElement;
  sprites: SpriteRect[];
  width: number;
  height: number;
}

interface ExportSettingsProps {
  image: HTMLImageElement;
  fileName: string;
  sprites: SpriteRect[];
  onPreviewChange?: (preview: RepackPreview | null) => void;
  onShowBordersChange?: (show: boolean) => void;
}

export function ExportSettings({ image, fileName, sprites, onPreviewChange, onShowBordersChange }: ExportSettingsProps) {
  const [engine, setEngine] = useState<ExportEngine>("cocos");
  const [mode, setMode] = useState<ExportMode>("repack");
  const [sizeOption, setSizeOption] = useState("bestfit");
  const [padding, setPadding] = useState(1);
  const [trim, setTrim] = useState(false);
  const [showBorders, setShowBorders] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overflow, setOverflow] = useState<string[]>([]);
  const [bestFitSize, setBestFitSize] = useState(1024);
  const previewUrlRef = useRef<string | null>(null);

  const hasSprites = sprites.length > 0;

  const ENGINE_LABELS: Record<string, string> = { cocos: "Cocos Creator", unity: "Unity" };
  const MODE_LABELS: Record<string, string> = { original: "Original", repack: "Repack" };

  const resolvedMaxSize = sizeOption === "bestfit" ? bestFitSize : Number(sizeOption);

  // Calculate BestFit size
  useEffect(() => {
    if (sprites.length === 0) {
      setBestFitSize(64);
      return;
    }
    const packInput = sprites.map((s) => ({ id: s.id, width: s.width, height: s.height }));
    const size = findBestFitSize(packInput, padding);
    setBestFitSize(size);
  }, [sprites, padding]);

  // Compute repack preview
  useEffect(() => {
    if (mode !== "repack" || sprites.length === 0) {
      onPreviewChange?.(null);
      return;
    }

    const size = sizeOption === "bestfit" ? bestFitSize : Number(sizeOption);
    let cancelled = false;

    (async () => {
      try {
        const imageBitmap = await createImageBitmap(image);

        // Import repackAtlas dynamically to avoid circular deps
        const { repackAtlas } = await import("@/lib/repack-atlas");
        const result = await repackAtlas({
          sprites,
          sourceImage: imageBitmap,
          maxSize: size,
          padding,
          trim,
        });
        imageBitmap.close();

        if (cancelled) return;

        // Revoke previous preview URL
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);

        const url = URL.createObjectURL(result.imageBlob);
        previewUrlRef.current = url;

        const img = new Image();
        img.onload = () => {
          if (cancelled) {
            URL.revokeObjectURL(url);
            return;
          }
          onPreviewChange?.({
            image: img,
            sprites: result.sprites,
            width: result.width,
            height: result.height,
          });
        };
        img.src = url;
      } catch {
        // Ignore preview errors
      }
    })();

    return () => { cancelled = true; };
  }, [mode, sprites, bestFitSize, sizeOption, padding, trim, image, onPreviewChange]);

  // Clear preview when leaving repack mode
  useEffect(() => {
    if (mode !== "repack") {
      onPreviewChange?.(null);
    }
  }, [mode, onPreviewChange]);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);
    setOverflow([]);

    try {
      const settings: ExportSettingsType = {
        engine,
        mode,
        maxSize: resolvedMaxSize,
        padding,
        trim,
      };

      const result = await downloadAtlas({
        sprites,
        image,
        fileName,
        settings,
      });

      if (!result.success) {
        setError(result.error ?? "Export failed");
      } else if (result.overflow && result.overflow.length > 0) {
        setOverflow(result.overflow);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground">Export Settings</h3>

      {/* Engine */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Engine</Label>
        <Select value={engine} onValueChange={(val) => setEngine(val as ExportEngine)}>
          <SelectTrigger className="w-full">
            {ENGINE_LABELS[engine]}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cocos">Cocos Creator</SelectItem>
            <SelectItem value="unity">Unity</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Mode */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Mode</Label>
        <Select value={mode} onValueChange={(val) => setMode(val as ExportMode)}>
          <SelectTrigger className="w-full">
            {MODE_LABELS[mode]}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="original">Original</SelectItem>
            <SelectItem value="repack">Repack</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Repack options */}
      {mode === "repack" && (
        <div className="space-y-3 rounded-md border border-border p-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Max Size</Label>
            <Select
              value={sizeOption}
              onValueChange={(val) => { if (val) setSizeOption(val); }}
            >
              <SelectTrigger className="w-full">
                {sizeOption === "bestfit" ? `BestFit (${bestFitSize})` : sizeOption}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bestfit">BestFit ({bestFitSize})</SelectItem>
                <SelectItem value="256">256</SelectItem>
                <SelectItem value="512">512</SelectItem>
                <SelectItem value="1024">1024</SelectItem>
                <SelectItem value="2048">2048</SelectItem>
                <SelectItem value="4096">4096</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Padding</Label>
            <Input
              type="number"
              min={0}
              max={4}
              value={padding}
              onChange={(e) => {
                const v = Math.min(4, Math.max(0, Number(e.target.value) || 0));
                setPadding(v);
              }}
              className="h-8"
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              checked={trim}
              onCheckedChange={(checked) => setTrim(checked === true)}
              id="trim-checkbox"
            />
            <Label htmlFor="trim-checkbox" className="text-xs text-muted-foreground cursor-pointer">
              Trim transparent pixels
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              checked={showBorders}
              onCheckedChange={(checked) => {
                const val = checked === true;
                setShowBorders(val);
                onShowBordersChange?.(val);
              }}
              id="show-borders-checkbox"
            />
            <Label htmlFor="show-borders-checkbox" className="text-xs text-muted-foreground cursor-pointer">
              Show sprite borders
            </Label>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-2 text-xs text-destructive">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Overflow warning */}
      {overflow.length > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-yellow-500/50 bg-yellow-500/10 p-2 text-xs text-yellow-700 dark:text-yellow-400">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          <span>
            {overflow.length} sprite(s) could not fit in the atlas and were excluded.
          </span>
        </div>
      )}

      {/* Download button */}
      <Button
        onClick={handleDownload}
        disabled={!hasSprites || loading}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="size-4" />
            Download
          </>
        )}
      </Button>
    </div>
  );
}
