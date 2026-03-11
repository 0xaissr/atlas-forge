"use client";

import { useCallback, useRef, useState } from "react";

interface CanvasTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

const MIN_SCALE = 0.1;
const MAX_SCALE = 10;
const ZOOM_SENSITIVITY = 0.001;

export function useCanvasTransform() {
  const [transform, setTransform] = useState<CanvasTransform>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });

  const isPanning = useRef(false);
  const isSpaceHeld = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const fitToContainer = useCallback(
    (
      imageWidth: number,
      imageHeight: number,
      containerWidth: number,
      containerHeight: number
    ) => {
      const scaleX = containerWidth / imageWidth;
      const scaleY = containerHeight / imageHeight;
      const scale = Math.min(scaleX, scaleY) * 0.9; // 90% to add some padding
      const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));

      const offsetX = (containerWidth - imageWidth * clampedScale) / 2;
      const offsetY = (containerHeight - imageHeight * clampedScale) / 2;

      setTransform({ scale: clampedScale, offsetX, offsetY });
    },
    []
  );

  const resetToActual = useCallback(
    (containerWidth: number, containerHeight: number, imageWidth: number, imageHeight: number) => {
      const offsetX = (containerWidth - imageWidth) / 2;
      const offsetY = (containerHeight - imageHeight) / 2;
      setTransform({ scale: 1, offsetX, offsetY });
    },
    []
  );

  const onWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setTransform((prev) => {
      const zoomFactor = 1 - e.deltaY * ZOOM_SENSITIVITY;
      const newScale = Math.max(
        MIN_SCALE,
        Math.min(MAX_SCALE, prev.scale * zoomFactor)
      );
      const scaleRatio = newScale / prev.scale;

      // Zoom toward mouse position
      const newOffsetX = mouseX - (mouseX - prev.offsetX) * scaleRatio;
      const newOffsetY = mouseY - (mouseY - prev.offsetY) * scaleRatio;

      return { scale: newScale, offsetX: newOffsetX, offsetY: newOffsetY };
    });
  }, []);

  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      // Middle mouse button or space+left click
      if (e.button === 1 || (e.button === 0 && isSpaceHeld.current)) {
        e.preventDefault();
        isPanning.current = true;
        lastMousePos.current = { x: e.clientX, y: e.clientY };
      }
    },
    []
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isPanning.current) return;

      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      lastMousePos.current = { x: e.clientX, y: e.clientY };

      setTransform((prev) => ({
        ...prev,
        offsetX: prev.offsetX + dx,
        offsetY: prev.offsetY + dy,
      }));
    },
    []
  );

  const onMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || e.button === 0) {
      isPanning.current = false;
    }
  }, []);

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === "Space") {
      isSpaceHeld.current = true;
    }
  }, []);

  const onKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.code === "Space") {
      isSpaceHeld.current = false;
      isPanning.current = false;
    }
  }, []);

  return {
    scale: transform.scale,
    offsetX: transform.offsetX,
    offsetY: transform.offsetY,
    isPanning: isPanning.current,
    isSpaceHeld: isSpaceHeld.current,
    fitToContainer,
    resetToActual,
    onWheel,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onKeyDown,
    onKeyUp,
  };
}
