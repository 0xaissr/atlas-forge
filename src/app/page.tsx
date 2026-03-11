"use client";

import { useState, useCallback, useEffect } from "react";
import { ImageUploader } from "@/components/image-uploader";
import { ThemeToggle } from "@/components/theme-toggle";
import { CanvasPreview } from "@/components/canvas-preview";
import { SettingsPanel } from "@/components/settings-panel";
import { SpriteList } from "@/components/sprite-list";
import { SpriteProvider, useSprites } from "@/store/sprite-context";
import type { SplitMode } from "@/types";

function EditorLayout({
  image,
  fileName,
}: {
  image: HTMLImageElement;
  fileName: string;
}) {
  const [splitMode, setSplitMode] = useState<SplitMode>("grid");
  const [selectedSpriteId, setSelectedSpriteId] = useState<string | null>(null);
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
        <ThemeToggle />
      </header>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 relative">
          <CanvasPreview
            image={image}
            sprites={sprites}
            selectedSpriteId={selectedSpriteId}
            onSpriteSelect={setSelectedSpriteId}
            dispatch={dispatch}
          />
        </div>

        {/* Settings Panel + Sprite List */}
        <div className="flex h-full w-80 flex-col border-l border-border bg-card/80 backdrop-blur-sm">
          <SettingsPanel
            splitMode={splitMode}
            onSplitModeChange={setSplitMode}
            image={image}
            fileName={fileName}
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
      <EditorLayout image={image} fileName={fileName} />
    </SpriteProvider>
  );
}
