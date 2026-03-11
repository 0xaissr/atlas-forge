"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { ImageUploader } from "@/components/image-uploader";
import { ThemeToggle } from "@/components/theme-toggle";
import { CanvasPreview } from "@/components/canvas-preview";
import { SettingsPanel } from "@/components/settings-panel";
import { SpriteList } from "@/components/sprite-list";
import { ExportSettings } from "@/components/export-settings";
import { SpriteProvider, useSprites } from "@/store/sprite-context";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Scissors, Download, X, Plus } from "lucide-react";
import type { SplitMode, SpriteRect } from "@/types";

interface TabData {
  id: string;
  image: HTMLImageElement;
  fileName: string;
  sprites: SpriteRect[];
}

let tabCounter = 0;

function EditorContent({
  image,
  fileName,
}: {
  image: HTMLImageElement;
  fileName: string;
}) {
  const [splitMode, setSplitMode] = useState<SplitMode>("grid");
  const [selectedSpriteId, setSelectedSpriteId] = useState<string | null>(null);
  const [pickingBgColor, setPickingBgColor] = useState(false);
  const [bgColor, setBgColor] = useState<[number, number, number] | null>(null);
  const { sprites, dispatch, undo, redo, canUndo, canRedo } = useSprites();

  // Keyboard shortcuts: Delete, Undo, Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const isMod = e.metaKey || e.ctrlKey;

      if ((e.key === "Delete" || e.key === "Backspace") && selectedSpriteId) {
        e.preventDefault();
        dispatch({ type: "DELETE_SPRITE", id: selectedSpriteId });
        setSelectedSpriteId(null);
        return;
      }

      if (isMod && e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (canRedo) redo();
        return;
      }

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
    <>
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

      {/* Right Panel */}
      <div className="flex w-full flex-col border-t border-border bg-card/80 backdrop-blur-sm md:h-full md:w-80 md:border-l md:border-t-0">
        <Tabs defaultValue="split" className="flex flex-1 flex-col overflow-hidden">
          <div className="shrink-0 border-b border-border px-3 pt-2 pb-0">
            <TabsList className="w-full">
              <TabsTrigger value="split" className="flex items-center gap-1.5">
                <Scissors className="size-3.5" />
                Split
              </TabsTrigger>
              <TabsTrigger value="export" className="flex items-center gap-1.5">
                <Download className="size-3.5" />
                Export
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="split" className="mt-0 flex flex-1 flex-col overflow-hidden">
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
          </TabsContent>

          <TabsContent value="export" className="mt-0 flex-1 overflow-y-auto p-4">
            <ExportSettings image={image} fileName={fileName} sprites={sprites} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

function EmptyState({ onImageLoaded }: { onImageLoaded: (img: HTMLImageElement, name: string) => void }) {
  return (
    <div className="flex flex-1 items-center justify-center bg-[var(--canvas-bg)] p-8">
      <div className="w-full max-w-md">
        <ImageUploader onImageLoaded={onImageLoaded} />
      </div>
    </div>
  );
}

export default function App() {
  const [tabs, setTabs] = useState<TabData[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const addFileInputRef = useRef<HTMLInputElement>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null;

  const addTab = useCallback((img: HTMLImageElement, name: string) => {
    const id = `tab-${++tabCounter}`;
    const newTab: TabData = { id, image: img, fileName: name, sprites: [] };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(id);
  }, []);

  const closeTab = useCallback((tabId: string) => {
    setTabs((prev) => {
      const idx = prev.findIndex((t) => t.id === tabId);
      const next = prev.filter((t) => t.id !== tabId);
      // Revoke blob URL
      const tab = prev[idx];
      if (tab?.image?.src) URL.revokeObjectURL(tab.image.src);

      return next;
    });
    setActiveTabId((currentId) => {
      if (currentId !== tabId) return currentId;
      // Switch to adjacent tab
      const prev = tabs;
      const idx = prev.findIndex((t) => t.id === tabId);
      const remaining = prev.filter((t) => t.id !== tabId);
      if (remaining.length === 0) return null;
      const newIdx = Math.min(idx, remaining.length - 1);
      return remaining[newIdx].id;
    });
  }, [tabs]);

  const handleSpritesChange = useCallback((tabId: string, sprites: SpriteRect[]) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, sprites } : t))
    );
  }, []);

  const handleAddFile = useCallback(() => {
    addFileInputRef.current?.click();
  }, []);

  const handleAddFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const accepted = ["image/png", "image/jpeg", "image/webp"];
    files.forEach((file) => {
      if (!accepted.includes(file.type)) return;
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => addTab(img, file.name);
      img.onerror = () => URL.revokeObjectURL(url);
      img.src = url;
    });
    if (addFileInputRef.current) addFileInputRef.current.value = "";
  }, [addTab]);

  // Strip extension for display
  const displayName = (name: string) => name.replace(/\.[^.]+$/, "");

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-sm">
        <h1 className="font-[family-name:var(--font-jetbrains-mono)] text-lg font-bold tracking-tight text-foreground dark:text-primary dark:drop-shadow-[0_0_8px_var(--color-primary)]">
          Spritesheet to Atlas
        </h1>
        <ThemeToggle />
      </header>

      {/* Tab bar */}
      {tabs.length > 0 && (
        <div className="flex h-9 shrink-0 items-end gap-0 border-b border-border bg-card/60 px-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`group flex h-8 items-center gap-1.5 rounded-t-md border border-b-0 px-3 text-xs font-medium transition-colors ${
                tab.id === activeTabId
                  ? "border-border bg-background text-foreground"
                  : "border-transparent text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              }`}
            >
              <span className="max-w-[120px] truncate">{displayName(tab.fileName)}</span>
              <span
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                className="ml-1 rounded p-0.5 opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100"
              >
                <X className="size-3" />
              </span>
            </button>
          ))}
          <button
            onClick={handleAddFile}
            className="flex h-8 items-center gap-1 rounded-t-md px-2 text-xs text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
            title="Open file"
          >
            <Plus className="size-3.5" />
          </button>
          <input
            ref={addFileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.webp"
            multiple
            onChange={handleAddFileChange}
            className="hidden"
          />
        </div>
      )}

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        {activeTab ? (
          <SpriteProvider
            key={activeTab.id}
            initialSprites={activeTab.sprites}
            onSpritesChange={(sprites) => handleSpritesChange(activeTab.id, sprites)}
          >
            <EditorContent image={activeTab.image} fileName={activeTab.fileName} />
          </SpriteProvider>
        ) : (
          <EmptyState onImageLoaded={addTab} />
        )}
      </div>
    </div>
  );
}
