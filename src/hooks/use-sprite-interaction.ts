"use client";

import { useCallback, useRef, useState } from "react";
import type { SpriteAction, SpriteRect } from "@/types";

type HandlePosition =
  | "nw" | "n" | "ne"
  | "w" | "e"
  | "sw" | "s" | "se";

const HANDLE_TOLERANCE = 6; // px in image space
const MIN_SPRITE_SIZE = 2;

interface DragState {
  type: "resize";
  spriteId: string;
  handle: HandlePosition;
  startX: number;
  startY: number;
  originalRect: { x: number; y: number; width: number; height: number };
}

const CURSOR_MAP: Record<HandlePosition, string> = {
  nw: "nwse-resize",
  se: "nwse-resize",
  ne: "nesw-resize",
  sw: "nesw-resize",
  n: "ns-resize",
  s: "ns-resize",
  w: "ew-resize",
  e: "ew-resize",
};

interface UseSpriteInteractionParams {
  sprites: SpriteRect[];
  scale: number;
  offsetX: number;
  offsetY: number;
  dispatch: (action: SpriteAction) => void;
  selectedSpriteId: string | null;
  setSelectedSpriteId: (id: string | null) => void;
  isPanning: boolean;
}

export function useSpriteInteraction({
  sprites,
  scale,
  offsetX,
  offsetY,
  dispatch,
  selectedSpriteId,
  setSelectedSpriteId,
  isPanning,
}: UseSpriteInteractionParams) {
  const [cursor, setCursor] = useState("default");
  const dragStateRef = useRef<DragState | null>(null);
  const [dragPreview, setDragPreview] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const screenToImage = useCallback(
    (screenX: number, screenY: number) => {
      return {
        x: (screenX - offsetX) / scale,
        y: (screenY - offsetY) / scale,
      };
    },
    [scale, offsetX, offsetY]
  );

  const hitTestSprite = useCallback(
    (imgX: number, imgY: number): SpriteRect | null => {
      for (let i = sprites.length - 1; i >= 0; i--) {
        const s = sprites[i];
        if (
          imgX >= s.x &&
          imgX <= s.x + s.width &&
          imgY >= s.y &&
          imgY <= s.y + s.height
        ) {
          return s;
        }
      }
      return null;
    },
    [sprites]
  );

  const hitTestHandle = useCallback(
    (imgX: number, imgY: number, sprite: SpriteRect): HandlePosition | null => {
      const tol = HANDLE_TOLERANCE / scale;
      const { x, y, width, height } = sprite;
      const cx = x + width / 2;
      const cy = y + height / 2;
      const r = x + width;
      const b = y + height;

      const handles: { pos: HandlePosition; hx: number; hy: number }[] = [
        { pos: "nw", hx: x, hy: y },
        { pos: "n", hx: cx, hy: y },
        { pos: "ne", hx: r, hy: y },
        { pos: "w", hx: x, hy: cy },
        { pos: "e", hx: r, hy: cy },
        { pos: "sw", hx: x, hy: b },
        { pos: "s", hx: cx, hy: b },
        { pos: "se", hx: r, hy: b },
      ];

      for (const h of handles) {
        if (Math.abs(imgX - h.hx) <= tol && Math.abs(imgY - h.hy) <= tol) {
          return h.pos;
        }
      }
      return null;
    },
    [scale]
  );

  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isPanning) return;
      if (e.button !== 0) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const { x: imgX, y: imgY } = screenToImage(screenX, screenY);

      // Check if clicking on a handle of the selected sprite
      if (selectedSpriteId) {
        const selected = sprites.find((s) => s.id === selectedSpriteId);
        if (selected) {
          const handle = hitTestHandle(imgX, imgY, selected);
          if (handle) {
            e.preventDefault();
            e.stopPropagation();
            dragStateRef.current = {
              type: "resize",
              spriteId: selected.id,
              handle,
              startX: imgX,
              startY: imgY,
              originalRect: {
                x: selected.x,
                y: selected.y,
                width: selected.width,
                height: selected.height,
              },
            };
            return;
          }
        }
      }

      // Hit test for sprite selection
      const hit = hitTestSprite(imgX, imgY);
      setSelectedSpriteId(hit ? hit.id : null);
    },
    [
      isPanning,
      screenToImage,
      selectedSpriteId,
      sprites,
      hitTestHandle,
      hitTestSprite,
      setSelectedSpriteId,
    ]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isPanning) {
        setCursor("grab");
        return;
      }

      const rect = e.currentTarget.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const { x: imgX, y: imgY } = screenToImage(screenX, screenY);

      // Handle active drag
      if (dragStateRef.current) {
        const ds = dragStateRef.current;
        const dx = imgX - ds.startX;
        const dy = imgY - ds.startY;
        const orig = ds.originalRect;

        let newX = orig.x;
        let newY = orig.y;
        let newW = orig.width;
        let newH = orig.height;

        const handle = ds.handle;
        if (handle.includes("w")) {
          newX = orig.x + dx;
          newW = orig.width - dx;
        }
        if (handle.includes("e")) {
          newW = orig.width + dx;
        }
        if (handle.includes("n")) {
          newY = orig.y + dy;
          newH = orig.height - dy;
        }
        if (handle.includes("s")) {
          newH = orig.height + dy;
        }

        // Enforce minimum size
        if (newW < MIN_SPRITE_SIZE) {
          if (handle.includes("w")) newX = orig.x + orig.width - MIN_SPRITE_SIZE;
          newW = MIN_SPRITE_SIZE;
        }
        if (newH < MIN_SPRITE_SIZE) {
          if (handle.includes("n")) newY = orig.y + orig.height - MIN_SPRITE_SIZE;
          newH = MIN_SPRITE_SIZE;
        }

        setDragPreview({
          x: Math.round(newX),
          y: Math.round(newY),
          width: Math.round(newW),
          height: Math.round(newH),
        });
        return;
      }

      // Hover cursor logic
      if (selectedSpriteId) {
        const selected = sprites.find((s) => s.id === selectedSpriteId);
        if (selected) {
          const handle = hitTestHandle(imgX, imgY, selected);
          if (handle) {
            setCursor(CURSOR_MAP[handle]);
            return;
          }
        }
      }

      const hovered = hitTestSprite(imgX, imgY);
      setCursor(hovered ? "pointer" : "crosshair");
    },
    [
      isPanning,
      screenToImage,
      selectedSpriteId,
      sprites,
      hitTestHandle,
      hitTestSprite,
    ]
  );

  const onMouseUp = useCallback(
    () => {
      if (dragStateRef.current && dragPreview) {
        const ds = dragStateRef.current;
        dispatch({
          type: "UPDATE_SPRITE",
          id: ds.spriteId,
          updates: {
            x: dragPreview.x,
            y: dragPreview.y,
            width: dragPreview.width,
            height: dragPreview.height,
          },
        });
        setDragPreview(null);
      }
      dragStateRef.current = null;
    },
    [dragPreview, dispatch]
  );

  return {
    onMouseDown,
    onMouseMove,
    onMouseUp,
    cursor,
    dragPreview,
    isDragging: dragStateRef.current !== null,
  };
}
