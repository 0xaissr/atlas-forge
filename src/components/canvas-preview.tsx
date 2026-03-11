"use client";

import { useCallback, useEffect, useRef } from "react";
import type { SpriteAction, SpriteRect } from "@/types";
import { useCanvasTransform } from "@/hooks/use-canvas-transform";
import { useSpriteInteraction } from "@/hooks/use-sprite-interaction";

interface CanvasPreviewProps {
  image: HTMLImageElement;
  sprites: SpriteRect[];
  selectedSpriteId: string | null;
  onSpriteSelect: (id: string | null) => void;
  dispatch: (action: SpriteAction) => void;
  onCanvasClick?: (imageX: number, imageY: number) => void;
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
    handleFill: "#ffffff",
    handleBorder: "#9c27b0",
    dragBorder: "#ff9800",
    dragGlow: "rgba(255, 152, 0, 0.5)",
  },
  dark: {
    checkerA: "#1a1a2e",
    checkerB: "#16213e",
    spriteBorder: "#00e5ff",
    spriteGlow: "rgba(0, 229, 255, 0.4)",
    selectedBorder: "#d050ff",
    selectedGlow: "rgba(208, 80, 255, 0.6)",
    handleFill: "#1a1a2e",
    handleBorder: "#d050ff",
    dragBorder: "#ffab40",
    dragGlow: "rgba(255, 171, 64, 0.6)",
  },
};

const CHECKER_SIZE = 8;
const HANDLE_SIZE = 6; // px in screen space

export function CanvasPreview({
  image,
  sprites,
  selectedSpriteId,
  onSpriteSelect,
  dispatch,
  onCanvasClick,
}: CanvasPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const containerSizeRef = useRef({ width: 0, height: 0 });

  const {
    scale,
    offsetX,
    offsetY,
    isPanning,
    isSpaceHeld,
    fitToContainer,
    resetToActual,
    onWheel,
    onMouseDown: onPanMouseDown,
    onMouseMove: onPanMouseMove,
    onMouseUp: onPanMouseUp,
    onKeyDown,
    onKeyUp,
  } = useCanvasTransform();

  const {
    onMouseDown: onInteractionMouseDown,
    onMouseMove: onInteractionMouseMove,
    onMouseUp: onInteractionMouseUp,
    cursor,
    dragPreview,
  } = useSpriteInteraction({
    sprites,
    scale,
    offsetX,
    offsetY,
    dispatch,
    selectedSpriteId,
    setSelectedSpriteId: onSpriteSelect,
    isPanning: isPanning || isSpaceHeld,
  });

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
      // If dragging, show the drag preview instead
      const rect = dragPreview || selectedSprite;
      const borderColor = dragPreview ? colors.dragBorder : colors.selectedBorder;
      const glowColor = dragPreview ? colors.dragGlow : colors.selectedGlow;

      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 2 / scale;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 8 / scale;
      ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
      ctx.shadowBlur = 0;

      // 5. Draw 8 control handles on the selected sprite
      const handleSizeImg = HANDLE_SIZE / scale;
      const half = handleSizeImg / 2;
      const { x, y, width: sw, height: sh } = rect;
      const cx = x + sw / 2;
      const cy = y + sh / 2;

      const handles = [
        { hx: x, hy: y },           // nw
        { hx: cx, hy: y },          // n
        { hx: x + sw, hy: y },      // ne
        { hx: x, hy: cy },          // w
        { hx: x + sw, hy: cy },     // e
        { hx: x, hy: y + sh },      // sw
        { hx: cx, hy: y + sh },     // s
        { hx: x + sw, hy: y + sh }, // se
      ];

      for (const h of handles) {
        ctx.fillStyle = colors.handleFill;
        ctx.strokeStyle = colors.handleBorder;
        ctx.lineWidth = 1.5 / scale;
        ctx.fillRect(h.hx - half, h.hy - half, handleSizeImg, handleSizeImg);
        ctx.strokeRect(h.hx - half, h.hy - half, handleSizeImg, handleSizeImg);
      }
    }

    ctx.restore();
  }, [image, sprites, selectedSpriteId, scale, offsetX, offsetY, isDarkMode, dragPreview]);

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

  // Merged mouse handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (onCanvasClick) {
        // Pick color mode: convert screen coords to image coords
        const rect = e.currentTarget.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const screenX = (e.clientX - rect.left) * dpr;
        const screenY = (e.clientY - rect.top) * dpr;
        const imageX = (screenX - offsetX) / scale;
        const imageY = (screenY - offsetY) / scale;
        onCanvasClick(imageX, imageY);
        return;
      }
      onPanMouseDown(e);
      onInteractionMouseDown(e);
    },
    [onPanMouseDown, onInteractionMouseDown, onCanvasClick, offsetX, offsetY, scale]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      onPanMouseMove(e);
      onInteractionMouseMove(e);
    },
    [onPanMouseMove, onInteractionMouseMove]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      onPanMouseUp(e);
      onInteractionMouseUp();
    },
    [onPanMouseUp, onInteractionMouseUp]
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
        className="absolute inset-0"
        style={{ cursor }}
        onWheel={onWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
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
