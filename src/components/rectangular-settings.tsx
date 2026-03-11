"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Loader2, Scan, Pipette } from "lucide-react";
import { useSprites } from "@/store/sprite-context";
import type { SpriteRect } from "@/types";

interface RectangularSettingsProps {
  image: HTMLImageElement;
  fileName: string;
  onPickBgColor?: () => void;
  bgColor: [number, number, number] | null;
}

export function RectangularSettings({
  image,
  fileName,
  onPickBgColor,
  bgColor,
}: RectangularSettingsProps) {
  const { dispatch } = useSprites();
  const [padding, setPadding] = useState(0);
  const [alphaThreshold, setAlphaThreshold] = useState(0);
  const [bgTolerance, setBgTolerance] = useState(30);
  const [minSize, setMinSize] = useState(4);
  const [detecting, setDetecting] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const hasAutoDetected = useRef(false);

  // Cleanup worker on unmount
  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const detect = useCallback(() => {
    setDetecting(true);

    // Terminate previous worker if any
    workerRef.current?.terminate();

    // Draw image to offscreen canvas to get ImageData
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Create worker
    const worker = new Worker(
      new URL("../workers/detect-sprites.worker.ts", import.meta.url)
    );
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<SpriteRect[]>) => {
      dispatch({ type: "SET_SPRITES", sprites: event.data });
      setDetecting(false);
    };

    worker.onerror = () => {
      setDetecting(false);
    };

    // Transfer the buffer for performance
    const buffer = imageData.data.buffer;
    worker.postMessage(
      {
        imageData: buffer,
        width: canvas.width,
        height: canvas.height,
        alphaThreshold,
        padding,
        fileName,
        bgColor,
        bgTolerance,
        minSize,
      },
      [buffer]
    );
  }, [image, alphaThreshold, padding, fileName, dispatch, bgColor, bgTolerance, minSize]);

  // Auto-detect on first render
  useEffect(() => {
    if (!hasAutoDetected.current) {
      hasAutoDetected.current = true;
      detect();
    }
  }, [detect]);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-foreground">Rectangular Split</h3>
      <p className="text-xs text-muted-foreground">
        自動偵測邊界，找出每個 sprite 的外框。支援取樣背景色來處理非透明背景。
      </p>

      {/* Background Color Picker */}
      <div className="space-y-2">
        <Label className="text-xs">Background Color</Label>
        <div className="flex items-center gap-2">
          <button
            onClick={onPickBgColor}
            className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-1.5 text-xs transition-colors hover:bg-muted"
          >
            <Pipette className="size-3.5" />
            Pick from image
          </button>
          {bgColor ? (
            <div className="flex items-center gap-2">
              <div
                className="size-6 rounded border border-border"
                style={{ backgroundColor: `rgb(${bgColor[0]}, ${bgColor[1]}, ${bgColor[2]})` }}
              />
              <span className="text-xs text-muted-foreground">
                ({bgColor[0]}, {bgColor[1]}, {bgColor[2]})
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">未設定（僅用 alpha）</span>
          )}
        </div>
      </div>

      {/* Background Tolerance */}
      {bgColor && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Color Tolerance</Label>
            <Input
              type="number"
              min={0}
              max={200}
              value={bgTolerance}
              onChange={(e) => setBgTolerance(Math.max(0, Math.min(200, Number(e.target.value))))}
              className="h-7 w-16 text-xs text-right"
            />
          </div>
          <Slider
            value={[bgTolerance]}
            min={0}
            max={200}
            step={1}
            onValueChange={(val) => setBgTolerance(Array.isArray(val) ? val[0] : val)}
          />
        </div>
      )}

      {/* Padding */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="rect-padding" className="text-xs">
            Padding
          </Label>
          <Input
            id="rect-padding"
            type="number"
            min={0}
            max={10}
            value={padding}
            onChange={(e) => setPadding(Math.max(0, Math.min(10, Number(e.target.value))))}
            className="h-7 w-16 text-xs text-right"
          />
        </div>
        <Slider
          value={[padding]}
          min={0}
          max={10}
          step={1}
          onValueChange={(val) => setPadding(Array.isArray(val) ? val[0] : val)}
        />
      </div>

      {/* Alpha Threshold */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="rect-alpha" className="text-xs">
            Alpha Threshold
          </Label>
          <Input
            id="rect-alpha"
            type="number"
            min={0}
            max={255}
            value={alphaThreshold}
            onChange={(e) =>
              setAlphaThreshold(Math.max(0, Math.min(255, Number(e.target.value))))
            }
            className="h-7 w-16 text-xs text-right"
          />
        </div>
        <Slider
          value={[alphaThreshold]}
          min={0}
          max={255}
          step={1}
          onValueChange={(val) => setAlphaThreshold(Array.isArray(val) ? val[0] : val)}
        />
      </div>

      {/* Min Size */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Min Sprite Size (px)</Label>
          <Input
            type="number"
            min={1}
            max={100}
            value={minSize}
            onChange={(e) => setMinSize(Math.max(1, Math.min(100, Number(e.target.value))))}
            className="h-7 w-16 text-xs text-right"
          />
        </div>
      </div>

      {/* Detect Button */}
      <button
        onClick={detect}
        disabled={detecting}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {detecting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Detecting...
          </>
        ) : (
          <>
            <Scan className="size-4" />
            Detect
          </>
        )}
      </button>

      {/* Info */}
      <p className="text-xs text-muted-foreground">
        Image: {image.naturalWidth} x {image.naturalHeight}px
      </p>
    </div>
  );
}
