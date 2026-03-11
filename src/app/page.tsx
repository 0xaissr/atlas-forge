"use client";

import { useState, useCallback } from "react";
import { ImageUploader } from "@/components/image-uploader";
import { ThemeToggle } from "@/components/theme-toggle";
import { CanvasPreview } from "@/components/canvas-preview";
import { SettingsPanel } from "@/components/settings-panel";
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
  const { sprites } = useSprites();

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
          />
        </div>

        {/* Settings Panel */}
        <SettingsPanel
          splitMode={splitMode}
          onSplitModeChange={setSplitMode}
        />
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
