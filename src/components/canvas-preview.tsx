"use client";

import { useCallback, useEffect, useRef } from "react";
import type { SpriteRect } from "@/types";
import { useCanvasTransform } from "@/hooks/use-canvas-transform";

interface CanvasPreviewProps {
  image: HTMLImageElement;
  sprites: SpriteRect[];
  selectedSpriteId: string | null;
  onSpriteSelect?: (id: string | null) => void;
}

// Canvas drawing colors — switch based on dark mode
const COLORS = {
  light: {
    checkerA: "#e0e0e0",
    checkerB: "#cccccc",
    spriteBorder: "#00acc1",
    spriteGlow: "rgba(0, 172, 193, 0.3)",
    selectedBorder: "#9c27b0",
    selectedGlow: "rgba(156, 39, 176, 0.5)",
    statusBg: "rgba(255, 255, 255, 0.9)",
    statusText: "#333333",
  },
  dark: {
    checkerA: "#1a1a2e",
    checkerB: "#16213e",
    spriteBorder: "#00e5ff",
    spriteGlow: "rgba(0, 229, 255, 0.4)",
    selectedBorder: "#d050ff",
    selectedGlow: "rgba(208, 80, 255, 0.6)",
    statusBg: "rgba(20, 20, 40, 0.9)",
    statusText: "#e0e0e0",
  },
};

const CHECKER_SIZE = 8;

export function CanvasPreview({
  image,
  sprites,
  selectedSpriteId,
  onSpriteSelect,
}: CanvasPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const containerSizeRef = useRef({ width: 0, height: 0 });

  const {
    scale,
    offsetX,
    offsetY,
    fitToContainer,
    resetToActual,
    onWheel,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onKeyDown,
    onKeyUp,
  } = useCanvasTransform();

  const isDarkMode = useCallback(() => {
    return document.documentElement.classList.contains("dark");
  }, []);

  // Draw the canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;
    const colors = isDarkMode() ? COLORS.dark : COLORS.light;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // 1. Checkerboard background (only behind the image area)
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    const imgW = image.width;
    const imgH = image.height;

    // Clip to image bounds for checkerboard
    ctx.beginPath();
    ctx.rect(0, 0, imgW, imgH);
    ctx.clip();

    for (let y = 0; y < imgH; y += CHECKER_SIZE) {
      for (let x = 0; x < imgW; x += CHECKER_SIZE) {
        const isEven = ((x / CHECKER_SIZE) + (y / CHECKER_SIZE)) % 2 === 0;
        ctx.fillStyle = isEven ? colors.checkerA : colors.checkerB;
        ctx.fillRect(x, y, CHECKER_SIZE, CHECKER_SIZE);
      }
    }

    // 2. Draw the image
    ctx.drawImage(image, 0, 0);

    ctx.restore();

    // 3. Draw sprite bounding boxes
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    for (const sprite of sprites) {
      const isSelected = sprite.id === selectedSpriteId;

      if (isSelected) continue; // Draw selected sprite last

      ctx.strokeStyle = colors.spriteBorder;
      ctx.lineWidth = 2 / scale;
      ctx.shadowColor = colors.spriteGlow;
      ctx.shadowBlur = 4 / scale;
      ctx.strokeRect(sprite.x, sprite.y, sprite.width, sprite.height);
      ctx.shadowBlur = 0;
    }

    // 4. Draw selected sprite on top
    const selectedSprite = sprites.find((s) => s.id === selectedSpriteId);
    if (selectedSprite) {
      ctx.strokeStyle = colors.selectedBorder;
      ctx.lineWidth = 2 / scale;
      ctx.shadowColor = colors.selectedGlow;
      ctx.shadowBlur = 8 / scale;
      ctx.strokeRect(
        selectedSprite.x,
        selectedSprite.y,
        selectedSprite.width,
        selectedSprite.height
      );
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }, [image, sprites, selectedSpriteId, scale, offsetX, offsetY, isDarkMode]);

  // Animation loop
  useEffect(() => {
    const loop = () => {
      draw();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [draw]);

  // ResizeObserver to track container size
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.scale(dpr, dpr);
        containerSizeRef.current = { width, height };
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Auto-fit on initial load
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !image) return;

    // Small delay to let ResizeObserver fire first
    const timer = setTimeout(() => {
      const { width, height } = containerSizeRef.current;
      if (width > 0 && height > 0) {
        fitToContainer(image.width, image.height, width, height);
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [image, fitToContainer]);

  // Keyboard event listeners
  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [onKeyDown, onKeyUp]);

  // Click to select sprite
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!onSpriteSelect) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Convert screen coords to image coords
      const imgX = (mouseX - offsetX) / scale;
      const imgY = (mouseY - offsetY) / scale;

      // Find sprite under cursor (reverse order for z-index priority)
      let found: string | null = null;
      for (let i = sprites.length - 1; i >= 0; i--) {
        const s = sprites[i];
        if (
          imgX >= s.x &&
          imgX <= s.x + s.width &&
          imgY >= s.y &&
          imgY <= s.y + s.height
        ) {
          found = s.id;
          break;
        }
      }

      onSpriteSelect(found);
    },
    [onSpriteSelect, sprites, scale, offsetX, offsetY]
  );

  const handleFit = useCallback(() => {
    const { width, height } = containerSizeRef.current;
    if (width > 0 && height > 0) {
      fitToContainer(image.width, image.height, width, height);
    }
  }, [fitToContainer, image]);

  const handleActual = useCallback(() => {
    const { width, height } = containerSizeRef.current;
    if (width > 0 && height > 0) {
      resetToActual(width, height, image.width, image.height);
    }
  }, [resetToActual, image]);

  const zoomPercent = Math.round(scale * 100);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-[var(--canvas-bg)]">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onClick={handleClick}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Bottom status bar */}
      <div className="absolute bottom-0 left-0 right-0 h-8 flex items-center px-3 gap-4 text-xs font-mono bg-card/90 border-t border-border text-muted-foreground backdrop-blur-sm">
        <span>
          {image.width} x {image.height}
        </span>
        <span>{sprites.length} sprites</span>
        <span>{zoomPercent}%</span>
        <div className="ml-auto flex gap-1">
          <button
            onClick={handleFit}
            className="px-2 py-0.5 rounded text-xs border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Fit
          </button>
          <button
            onClick={handleActual}
            className="px-2 py-0.5 rounded text-xs border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            1:1
          </button>
        </div>
      </div>
    </div>
  );
}
