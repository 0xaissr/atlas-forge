"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { splitGrid } from "@/lib/split-grid";
import { filterEmptySprites } from "@/lib/filter-empty";
import { useSprites } from "@/store/sprite-context";

interface GridSettingsProps {
  image: HTMLImageElement;
  fileName: string;
}

export function GridSettings({ image, fileName }: GridSettingsProps) {
  const { dispatch } = useSprites();

  const [cellWidth, setCellWidth] = useState(64);
  const [cellHeight, setCellHeight] = useState(64);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [spacingX, setSpacingX] = useState(0);
  const [spacingY, setSpacingY] = useState(0);
  const [filterEmpty, setFilterEmpty] = useState(false);

  const applyGrid = useCallback(() => {
    if (cellWidth <= 0 || cellHeight <= 0) {
      dispatch({ type: "SET_SPRITES", sprites: [] });
      return;
    }

    let sprites = splitGrid({
      imageWidth: image.naturalWidth,
      imageHeight: image.naturalHeight,
      cellWidth,
      cellHeight,
      offsetX,
      offsetY,
      spacingX,
      spacingY,
      fileName,
    });

    if (filterEmpty) {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(image, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      sprites = filterEmptySprites(imageData, sprites);
    }

    dispatch({ type: "SET_SPRITES", sprites });
  }, [cellWidth, cellHeight, offsetX, offsetY, spacingX, spacingY, filterEmpty, image, fileName, dispatch]);

  useEffect(() => {
    applyGrid();
  }, [applyGrid]);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-highlight">Grid Split</h3>
      <p className="text-xs text-muted-foreground">
        以固定格線切割 spritesheet，適用於等寬等高的圖塊。
      </p>

      {/* Cell Size */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="cell-width" className="text-xs text-label">
            Cell Width
          </Label>
          <Input
            id="cell-width"
            type="number"
            min={1}
            value={cellWidth}
            onChange={(e) => setCellWidth(Number(e.target.value))}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cell-height" className="text-xs text-label">
            Cell Height
          </Label>
          <Input
            id="cell-height"
            type="number"
            min={1}
            value={cellHeight}
            onChange={(e) => setCellHeight(Number(e.target.value))}
            className="h-8 text-xs"
          />
        </div>
      </div>

      {/* Offset */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="offset-x" className="text-xs text-label">
            Offset X
          </Label>
          <Input
            id="offset-x"
            type="number"
            min={0}
            value={offsetX}
            onChange={(e) => setOffsetX(Number(e.target.value))}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="offset-y" className="text-xs text-label">
            Offset Y
          </Label>
          <Input
            id="offset-y"
            type="number"
            min={0}
            value={offsetY}
            onChange={(e) => setOffsetY(Number(e.target.value))}
            className="h-8 text-xs"
          />
        </div>
      </div>

      {/* Spacing */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="spacing-x" className="text-xs text-label">
            Spacing X
          </Label>
          <Input
            id="spacing-x"
            type="number"
            min={0}
            value={spacingX}
            onChange={(e) => setSpacingX(Number(e.target.value))}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="spacing-y" className="text-xs text-label">
            Spacing Y
          </Label>
          <Input
            id="spacing-y"
            type="number"
            min={0}
            value={spacingY}
            onChange={(e) => setSpacingY(Number(e.target.value))}
            className="h-8 text-xs"
          />
        </div>
      </div>

      {/* Filter Empty */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="filter-empty"
          checked={filterEmpty}
          onCheckedChange={(checked) => setFilterEmpty(checked === true)}
        />
        <Label htmlFor="filter-empty" className="text-xs cursor-pointer">
          Filter empty cells
        </Label>
      </div>

      {/* Info */}
      <p className="text-xs text-muted-foreground">
        Image: {image.naturalWidth} x {image.naturalHeight}px
      </p>
    </div>
  );
}
