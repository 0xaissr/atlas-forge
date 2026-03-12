"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { ImageUploader } from "@/components/image-uploader";
import { ThemeToggle } from "@/components/theme-toggle";
import { CanvasPreview } from "@/components/canvas-preview";
import { SettingsPanel } from "@/components/settings-panel";
import { SpriteList } from "@/components/sprite-list";
import { AnimationPreview } from "@/components/animation-preview";
import { ExportSettings, type RepackPreview } from "@/components/export-settings";
import { SpriteProvider, useSprites } from "@/store/sprite-context";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scissors, Download, X, Plus, Film, List } from "lucide-react";
import type { SplitMode, SpriteRect } from "@/types";

interface TabData {
  id: string;
  image: HTMLImageElement;
  fileName: string;
  sprites: SpriteRect[];
  activePanel: string;
}

let tabCounter = Date.now();

function EditorContent({
  image,
  fileName,
  activeMainTab,
  onMainTabChange,
}: {
  image: HTMLImageElement;
  fileName: string;
  activeMainTab: string;
  onMainTabChange: (tab: string) => void;
}) {
  const [splitMode, setSplitMode] = useState<SplitMode>("rectangular");
  const [selectedSpriteId, setSelectedSpriteId] = useState<string | null>(null);
  const [pickingBgColor, setPickingBgColor] = useState(false);
  const [bgColor, setBgColor] = useState<[number, number, number] | null>(null);
  const [repackPreview, setRepackPreview] = useState<RepackPreview | null>(null);
  const [showRepackBorders, setShowRepackBorders] = useState(false);
  const { sprites, dispatch, undo, redo, canUndo, canRedo } = useSprites();

  // Determine what to show in canvas
  const showRepack = activeMainTab === "export" && repackPreview !== null;
  const canvasImage = showRepack ? repackPreview.image : image;
  const canvasSprites = showRepack
    ? (showRepackBorders ? repackPreview.sprites : [])
    : sprites;

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

  // Bottom panel system
  const [bottomPanel, setBottomPanel] = useState<"animation" | "sprites" | null>("animation");
  const [bottomHeight, setBottomHeight] = useState(220);
  const resizingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    resizingRef.current = true;
    startYRef.current = e.clientY;
    startHeightRef.current = bottomHeight;

    const handleMouseMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return;
      const delta = startYRef.current - ev.clientY;
      setBottomHeight(Math.max(120, Math.min(500, startHeightRef.current + delta)));
    };
    const handleMouseUp = () => {
      resizingRef.current = false;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [bottomHeight]);

  const togglePanel = useCallback((panel: "animation" | "sprites") => {
    setBottomPanel((prev) => (prev === panel ? null : panel));
  }, []);

  return (
    <>
      {/* Main area: canvas + bottom panels */}
      <div className="flex flex-1 flex-col min-h-0 min-w-0">
        {/* Canvas */}
        <div className="relative flex-1 min-h-[100px]">
          {pickingBgColor && (
            <div className="absolute inset-0 z-10 flex cursor-crosshair items-center justify-center bg-black/30 pointer-events-none">
              <span className="rounded bg-black/70 px-3 py-1.5 text-sm text-white">
                Click on the background to pick color
              </span>
            </div>
          )}
          <CanvasPreview
            image={canvasImage}
            sprites={canvasSprites}
            selectedSpriteId={showRepack ? null : selectedSpriteId}
            onSpriteSelect={(id) => {
              if (pickingBgColor || showRepack) return;
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

        {/* Bottom panel system */}
        <div className="flex shrink-0 border-t border-border">
          {/* Icon bar */}
          <div className="flex flex-col items-center gap-1 border-r border-border bg-card/80 px-1 py-2">
            <button
              onClick={() => togglePanel("animation")}
              className={`rounded p-1.5 transition-colors ${
                bottomPanel === "animation"
                  ? "bg-highlight text-white"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
              title="Animation Preview"
            >
              <Film className="size-4" />
            </button>
            <button
              onClick={() => togglePanel("sprites")}
              className={`rounded p-1.5 transition-colors ${
                bottomPanel === "sprites"
                  ? "bg-highlight text-white"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
              title="Sprites"
            >
              <List className="size-4" />
            </button>
          </div>

          {/* Panel content */}
          {bottomPanel && (
            <div className="flex flex-1 flex-col min-w-0" style={{ height: bottomHeight }}>
              {/* Resize handle */}
              <div
                onMouseDown={handleResizeStart}
                className="h-1 cursor-ns-resize bg-border hover:bg-primary/50 transition-colors"
              />
              {/* Animation preview */}
              <div className={`flex-1 min-h-0 ${bottomPanel !== "animation" ? "hidden" : ""}`}>
                <AnimationPreview image={image} />
              </div>
              {/* Sprites list */}
              <div className={`flex-1 min-h-0 overflow-y-auto ${bottomPanel !== "sprites" ? "hidden" : ""}`}>
                <SpriteList
                  selectedSpriteId={selectedSpriteId}
                  setSelectedSpriteId={setSelectedSpriteId}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex w-full flex-col border-t border-border bg-card/80 backdrop-blur-sm md:h-full md:w-80 md:border-l md:border-t-0">
        <Tabs value={activeMainTab} onValueChange={onMainTabChange} className="flex flex-1 flex-col overflow-hidden">
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

          {/* Use CSS visibility instead of unmounting to preserve state */}
          <div className={`mt-0 flex flex-1 flex-col overflow-hidden ${activeMainTab !== "split" ? "hidden" : ""}`}>
            <SettingsPanel
              splitMode={splitMode}
              onSplitModeChange={setSplitMode}
              image={image}
              fileName={fileName}
              sprites={sprites}
              onPickBgColor={() => setPickingBgColor(true)}
              bgColor={bgColor}
            />
          </div>

          <div className={`mt-0 flex-1 overflow-y-auto p-4 ${activeMainTab !== "export" ? "hidden" : ""}`}>
            <ExportSettings
              image={image}
              fileName={fileName}
              sprites={sprites}
              onPreviewChange={setRepackPreview}
              onShowBordersChange={setShowRepackBorders}
            />
          </div>
        </Tabs>
      </div>
    </>
  );
}

function EmptyState({ onImageLoaded }: { onImageLoaded: (img: HTMLImageElement, name: string) => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-[var(--canvas-bg)] p-8 gap-6">
      <div className="flex flex-col items-center gap-3">
        <img src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/assets/icon/icon.png`} alt="AtlasForge" className="h-48 w-auto rounded-xl" />
        <span className="font-[family-name:var(--font-orbitron)] text-2xl font-semibold tracking-wide text-highlight">
          SpriteSheet to Atlas
        </span>
      </div>
      <div className="w-full max-w-md">
        <ImageUploader onImageLoaded={onImageLoaded} />
      </div>
      {/* Footer */}
      <footer className="flex flex-col items-center gap-2 pt-4">
        <span className="text-xs text-muted-foreground">by 0xaissr</span>
        <div className="flex items-center gap-3">
          <a href="https://github.com/0xaissr/atlas-forge" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" title="GitHub">
            <svg className="size-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
          </a>
          <a href="https://www.threads.net/@aissr.lab" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" title="Threads">
            <svg className="size-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.59 12c.025 3.086.718 5.496 2.057 7.164 1.432 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.2 1.48-.69 2.61-1.475 3.388-.97.963-2.323 1.452-4.02 1.452-1.266 0-2.364-.353-3.18-1.024-.89-.73-1.38-1.774-1.38-2.94 0-2.11 1.646-3.633 3.915-3.633.946 0 1.777.258 2.404.727-.003-.822-.07-1.596-.207-2.312l2.018-.39c.207 1.073.293 2.248.254 3.498.762.496 1.394 1.12 1.86 1.87.627 1.008.934 2.197.934 3.534 0 .69-.077 1.334-.225 1.927-.589 2.342-2.186 4.039-4.676 4.967-1.396.52-3.003.79-4.762.807zm.538-8.563c-1.34 0-1.985.726-1.985 1.517 0 .463.206.87.58 1.14.418.306.993.46 1.71.46 1.073 0 1.943-.289 2.584-.862.463-.413.772-1.003.93-1.756-.57-.32-1.2-.499-1.819-.499z"/></svg>
          </a>
          <a href="https://instagram.com/aissr.lab" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" title="Instagram">
            <svg className="size-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </a>
        </div>
      </footer>
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
    const newTab: TabData = { id, image: img, fileName: name, sprites: [], activePanel: "split" };
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

  const handlePanelChange = useCallback((tabId: string, panel: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, activePanel: panel } : t))
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
      <header className="relative flex h-12 shrink-0 items-center justify-center border-b border-border bg-card/80 px-4 backdrop-blur-sm">
        <h1 className="font-[family-name:var(--font-orbitron)] text-lg font-bold tracking-wide text-foreground dark:text-primary dark:drop-shadow-[0_0_8px_var(--color-primary)]">
          AtlasForge
        </h1>
        <div className="absolute right-4">
          <ThemeToggle />
        </div>
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
                  ? "border-border bg-highlight text-white"
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
        {tabs.length === 0 && <EmptyState onImageLoaded={addTab} />}
        {tabs.map((tab) => (
          <SpriteProvider
            key={tab.id}
            initialSprites={tab.sprites}
            onSpritesChange={(sprites) => handleSpritesChange(tab.id, sprites)}
          >
            <div className={`flex flex-1 flex-col overflow-hidden md:flex-row ${tab.id !== activeTabId ? "hidden" : ""}`}>
              <EditorContent
                image={tab.image}
                fileName={tab.fileName}
                activeMainTab={tab.activePanel}
                onMainTabChange={(panel) => handlePanelChange(tab.id, panel)}
              />
            </div>
          </SpriteProvider>
        ))}
      </div>
    </div>
  );
}
