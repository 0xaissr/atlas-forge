"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { useSprites } from "@/store/sprite-context";

interface AnimationPreviewProps {
  image: HTMLImageElement;
}

export function AnimationPreview({ image }: AnimationPreviewProps) {
  const { sprites, dispatch } = useSprites();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [fps, setFps] = useState(12);
  const animRef = useRef<number>(0);
  const lastTimeRef = useRef(0);

  // Drag reorder state
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const frameCount = sprites.length;

  // Clamp current frame
  useEffect(() => {
    if (currentFrame >= frameCount) {
      setCurrentFrame(Math.max(0, frameCount - 1));
    }
  }, [frameCount, currentFrame]);

  // Animation loop
  useEffect(() => {
    if (!playing || frameCount === 0) return;

    const interval = 1000 / fps;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const delta = now - lastTime;
      if (delta >= interval) {
        lastTime = now - (delta % interval);
        setCurrentFrame((prev) => (prev + 1) % frameCount);
      }
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [playing, fps, frameCount]);

  // Draw current frame on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || frameCount === 0) return;

    const sprite = sprites[currentFrame];
    if (!sprite) return;

    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;

    // Size canvas to container
    const container = canvas.parentElement!;
    const maxW = container.clientWidth;
    const maxH = container.clientHeight;

    // Scale sprite to fit
    const scaleX = maxW / sprite.width;
    const scaleY = maxH / sprite.height;
    const scale = Math.min(scaleX, scaleY, 4); // Max 4x upscale

    const drawW = sprite.width * scale;
    const drawH = sprite.height * scale;

    canvas.width = maxW * dpr;
    canvas.height = maxH * dpr;
    canvas.style.width = `${maxW}px`;
    canvas.style.height = `${maxH}px`;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, maxW, maxH);

    // Checkerboard background
    const checkerSize = 8;
    const isDark = document.documentElement.classList.contains("dark");
    const colorA = isDark ? "#1a1a2e" : "#e0e0e0";
    const colorB = isDark ? "#16213e" : "#cccccc";

    const startX = (maxW - drawW) / 2;
    const startY = (maxH - drawH) / 2;

    ctx.save();
    ctx.beginPath();
    ctx.rect(startX, startY, drawW, drawH);
    ctx.clip();

    for (let cy = 0; cy < maxH; cy += checkerSize) {
      for (let cx = 0; cx < maxW; cx += checkerSize) {
        ctx.fillStyle = ((cx / checkerSize + cy / checkerSize) & 1) ? colorB : colorA;
        ctx.fillRect(cx, cy, checkerSize, checkerSize);
      }
    }
    ctx.restore();

    // Draw sprite centered
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      image,
      sprite.x, sprite.y, sprite.width, sprite.height,
      startX, startY, drawW, drawH
    );
  }, [currentFrame, sprites, frameCount, image]);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (!timelineRef.current) return;
    const active = timelineRef.current.children[currentFrame] as HTMLElement;
    if (active) {
      active.scrollIntoView({ inline: "center", behavior: "smooth", block: "nearest" });
    }
  }, [currentFrame]);

  // Drag reorder handlers
  const handleDragStart = useCallback((idx: number) => {
    setDragIdx(idx);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  }, []);

  const handleDrop = useCallback((idx: number) => {
    if (dragIdx === null || dragIdx === idx) {
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }

    const ids = sprites.map((s) => s.id);
    const [moved] = ids.splice(dragIdx, 1);
    ids.splice(idx, 0, moved);
    dispatch({ type: "REORDER_SPRITES", orderedIds: ids });

    // Update current frame to follow the dragged item
    setCurrentFrame(idx);
    setDragIdx(null);
    setDragOverIdx(null);
  }, [dragIdx, sprites, dispatch]);

  const handleDragEnd = useCallback(() => {
    setDragIdx(null);
    setDragOverIdx(null);
  }, []);

  if (frameCount === 0) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        尚無 Sprite 可預覽
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Preview area */}
      <div className="relative flex-1 min-h-0">
        <canvas ref={canvasRef} className="absolute inset-0" />
        {/* Frame counter */}
        <div className="absolute top-2 right-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-mono text-amber-400">
          {currentFrame + 1} / {frameCount}
        </div>
      </div>

      {/* Controls */}
      <div className="flex shrink-0 items-center gap-2 border-t border-border bg-card/80 px-3 py-1.5">
        <button
          onClick={() => setCurrentFrame(0)}
          className="rounded p-1 hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          title="First frame"
        >
          <SkipBack className="size-3.5" />
        </button>
        <button
          onClick={() => setPlaying((p) => !p)}
          className="rounded p-1.5 bg-highlight text-white hover:bg-highlight/80 transition-colors"
          title={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </button>
        <button
          onClick={() => setCurrentFrame(frameCount - 1)}
          className="rounded p-1 hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          title="Last frame"
        >
          <SkipForward className="size-3.5" />
        </button>

        <div className="ml-auto flex items-center gap-2">
          <label className="text-[10px] text-label">FPS</label>
          <input
            type="number"
            min={1}
            max={60}
            value={fps}
            onChange={(e) => setFps(Math.max(1, Math.min(60, Number(e.target.value) || 1)))}
            className="h-6 w-12 rounded border border-border bg-background px-1.5 text-xs text-center text-foreground outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Timeline thumbnails */}
      <div
        ref={timelineRef}
        className="flex shrink-0 gap-1 overflow-x-auto border-t border-border bg-card/60 px-2 py-1.5"
      >
        {sprites.map((sprite, idx) => {
          const isActive = idx === currentFrame;
          const isDragOver = idx === dragOverIdx && dragIdx !== null && dragIdx !== idx;

          return (
            <div
              key={sprite.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              onDragEnd={handleDragEnd}
              onClick={() => { setCurrentFrame(idx); setPlaying(false); }}
              className={`relative flex-shrink-0 cursor-pointer rounded border-2 transition-all ${
                isActive
                  ? "border-highlight shadow-[0_0_8px_var(--color-highlight)]"
                  : "border-transparent hover:border-muted-foreground/30"
              } ${isDragOver ? "border-l-primary border-l-2" : ""} ${
                dragIdx === idx ? "opacity-40" : ""
              }`}
              title={sprite.name}
            >
              <canvas
                width={40}
                height={40}
                className="block rounded-sm"
                ref={(c) => {
                  if (!c) return;
                  const ctx = c.getContext("2d")!;
                  ctx.clearRect(0, 0, 40, 40);
                  // Draw checkerboard
                  const dark = document.documentElement.classList.contains("dark");
                  for (let y = 0; y < 40; y += 4) {
                    for (let x = 0; x < 40; x += 4) {
                      ctx.fillStyle = ((x / 4 + y / 4) & 1)
                        ? (dark ? "#16213e" : "#cccccc")
                        : (dark ? "#1a1a2e" : "#e0e0e0");
                      ctx.fillRect(x, y, 4, 4);
                    }
                  }
                  // Fit sprite into 40x40
                  const sx = 40 / sprite.width;
                  const sy = 40 / sprite.height;
                  const s = Math.min(sx, sy);
                  const dw = sprite.width * s;
                  const dh = sprite.height * s;
                  ctx.imageSmoothingEnabled = false;
                  ctx.drawImage(
                    image,
                    sprite.x, sprite.y, sprite.width, sprite.height,
                    (40 - dw) / 2, (40 - dh) / 2, dw, dh
                  );
                }}
              />
              {/* Frame number */}
              <div className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 rounded-sm px-1 text-[9px] font-mono leading-tight ${
                isActive ? "bg-highlight text-white" : "bg-black/60 text-amber-400"
              }`}>
                {idx + 1}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
