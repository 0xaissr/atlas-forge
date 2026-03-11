"use client";

import { useState, useCallback, useEffect } from "react";
import { ImageUploader } from "@/components/image-uploader";
import { ThemeToggle } from "@/components/theme-toggle";
import { CanvasPreview } from "@/components/canvas-preview";
import { SettingsPanel } from "@/components/settings-panel";
import { SpriteList } from "@/components/sprite-list";
import { SpriteProvider, useSprites } from "@/store/sprite-context";
import { RotateCcw } from "lucide-react";
import type { SplitMode } from "@/types";

function EditorLayout({
  image,
  fileName,
  onReset,
}: {
  image: HTMLImageElement;
  fileName: string;
  onReset: () => void;
}) {
  const [splitMode, setSplitMode] = useState<SplitMode>("grid");
  const [selectedSpriteId, setSelectedSpriteId] = useState<string | null>(null);
  const [pickingBgColor, setPickingBgColor] = useState(false);
  const [bgColor, setBgColor] = useState<[number, number, number] | null>(null);
  const { sprites, dispatch, undo, redo, canUndo, canRedo } = useSprites();

  // Keyboard shortcuts: Delete, Undo, Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focused on an input or textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const isMod = e.metaKey || e.ctrlKey;

      // Delete / Backspace → delete selected sprite
      if ((e.key === "Delete" || e.key === "Backspace") && selectedSpriteId) {
        e.preventDefault();
        dispatch({ type: "DELETE_SPRITE", id: selectedSpriteId });
        setSelectedSpriteId(null);
        return;
      }

      // Ctrl/Cmd+Shift+Z → redo
      if (isMod && e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (canRedo) redo();
        return;
      }

      // Ctrl/Cmd+Z → undo
      if (isMod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (canUndo) undo();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedSpriteId, dispatch, undo, redo, canUndo, canRedo]);

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-sm">
        <h1 className="font-[family-name:var(--font-jetbrains-mono)] text-lg font-bold tracking-tight text-foreground dark:text-primary dark:drop-shadow-[0_0_8px_var(--color-primary)]">
          Spritesheet to Atlas
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title="Upload new image"
          >
            <RotateCcw className="size-3.5" />
            New
          </button>
          <ThemeToggle />
        </div>
      </header>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        {/* Canvas */}
        <div className="relative min-h-[40vh] flex-1 md:min-h-0">
          {pickingBgColor && (
            <div className="absolute inset-0 z-10 flex cursor-crosshair items-center justify-center bg-black/30">
              <span className="rounded bg-black/70 px-3 py-1.5 text-sm text-white">
                Click on the background to pick color
              </span>
            </div>
          )}
          <CanvasPreview
            image={image}
            sprites={sprites}
            selectedSpriteId={selectedSpriteId}
            onSpriteSelect={(id) => {
              if (pickingBgColor) return;
              setSelectedSpriteId(id);
            }}
            dispatch={dispatch}
            onCanvasClick={pickingBgColor ? (x, y) => {
              // Sample color from image at (x, y)
              const canvas = document.createElement("canvas");
              canvas.width = image.naturalWidth;
              canvas.height = image.naturalHeight;
              const ctx = canvas.getContext("2d")!;
              ctx.drawImage(image, 0, 0);
              const px = Math.round(Math.max(0, Math.min(x, image.naturalWidth - 1)));
              const py = Math.round(Math.max(0, Math.min(y, image.naturalHeight - 1)));
              const pixel = ctx.getImageData(px, py, 1, 1).data;
              setBgColor([pixel[0], pixel[1], pixel[2]]);
              setPickingBgColor(false);
            } : undefined}
          />
        </div>

        {/* Settings Panel + Sprite List */}
        <div className="flex w-full flex-col border-t border-border bg-card/80 backdrop-blur-sm md:h-full md:w-80 md:border-l md:border-t-0">
          <SettingsPanel
            splitMode={splitMode}
            onSplitModeChange={setSplitMode}
            image={image}
            fileName={fileName}
            sprites={sprites}
            onPickBgColor={() => setPickingBgColor(true)}
            bgColor={bgColor}
          />
          <div className="shrink-0 border-t border-border">
            <SpriteList
              selectedSpriteId={selectedSpriteId}
              setSelectedSpriteId={setSelectedSpriteId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState("");

  const handleImageLoaded = useCallback(
    (img: HTMLImageElement, name: string) => {
      setImage(img);
      setFileName(name);
    },
    []
  );

  const handleReset = useCallback(() => {
    if (image?.src) {
      URL.revokeObjectURL(image.src);
    }
    setImage(null);
    setFileName("");
  }, [image]);

  if (!image) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-8">
        <div className="w-full max-w-xl">
          <h1 className="mb-8 text-center font-[family-name:var(--font-jetbrains-mono)] text-3xl font-bold text-foreground dark:text-primary dark:drop-shadow-[0_0_12px_var(--color-primary)]">
            Spritesheet to Atlas
          </h1>
          <ImageUploader onImageLoaded={handleImageLoaded} />
        </div>
      </div>
    );
  }

  return (
    <SpriteProvider>
      <EditorLayout image={image} fileName={fileName} onReset={handleReset} />
    </SpriteProvider>
  );
}
