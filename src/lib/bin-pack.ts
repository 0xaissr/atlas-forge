interface PackInput {
  id: string;
  width: number;
  height: number;
}

interface PackedRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PackResult {
  packed: PackedRect[];
  overflow: PackInput[];
}

interface FreeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * MaxRects Best Short Side Fit (BSSF) bin packing algorithm.
 * Pure function — no Canvas/DOM dependencies.
 */
export function maxRectsPack(
  rects: PackInput[],
  binWidth: number,
  binHeight: number,
  padding: number
): PackResult {
  if (rects.length === 0) {
    return { packed: [], overflow: [] };
  }

  // Sort by area descending for better packing
  const sorted = [...rects].sort(
    (a, b) => b.width * b.height - a.width * a.height
  );

  const freeRects: FreeRect[] = [
    { x: 0, y: 0, width: binWidth, height: binHeight },
  ];

  const packed: PackedRect[] = [];
  const overflow: PackInput[] = [];

  for (const rect of sorted) {
    const paddedW = rect.width + padding;
    const paddedH = rect.height + padding;

    // Find best free rect using Best Short Side Fit
    let bestScore = Infinity;
    let bestFreeIdx = -1;
    let bestX = 0;
    let bestY = 0;

    for (let i = 0; i < freeRects.length; i++) {
      const free = freeRects[i];
      if (paddedW <= free.width && paddedH <= free.height) {
        const leftoverH = free.height - paddedH;
        const leftoverW = free.width - paddedW;
        const shortSide = Math.min(leftoverH, leftoverW);
        if (shortSide < bestScore) {
          bestScore = shortSide;
          bestFreeIdx = i;
          bestX = free.x;
          bestY = free.y;
        }
      }
    }

    if (bestFreeIdx === -1) {
      overflow.push(rect);
      continue;
    }

    // Place the rect (position without padding, but occupy paddedW x paddedH)
    packed.push({
      id: rect.id,
      x: bestX,
      y: bestY,
      width: rect.width,
      height: rect.height,
    });

    // The placed rectangle occupies this area (including padding)
    const placedRect: FreeRect = {
      x: bestX,
      y: bestY,
      width: paddedW,
      height: paddedH,
    };

    // Split all free rectangles that intersect with the placed rect
    const newFreeRects: FreeRect[] = [];
    for (const free of freeRects) {
      const splits = splitFreeRect(free, placedRect);
      newFreeRects.push(...splits);
    }

    // Replace free rects and prune contained ones
    freeRects.length = 0;
    for (let i = 0; i < newFreeRects.length; i++) {
      let contained = false;
      for (let j = 0; j < newFreeRects.length; j++) {
        if (i !== j && isContainedIn(newFreeRects[i], newFreeRects[j])) {
          contained = true;
          break;
        }
      }
      if (!contained) {
        freeRects.push(newFreeRects[i]);
      }
    }
  }

  return { packed, overflow };
}

/**
 * If the placed rect intersects the free rect, split the free rect
 * into up to 4 non-overlapping sub-rects. If no intersection, return
 * the free rect unchanged.
 */
function splitFreeRect(
  free: FreeRect,
  placed: FreeRect
): FreeRect[] {
  // Check if they intersect
  if (
    placed.x >= free.x + free.width ||
    placed.x + placed.width <= free.x ||
    placed.y >= free.y + free.height ||
    placed.y + placed.height <= free.y
  ) {
    // No intersection — keep the free rect
    return [free];
  }

  const result: FreeRect[] = [];

  // Left strip
  if (placed.x > free.x) {
    result.push({
      x: free.x,
      y: free.y,
      width: placed.x - free.x,
      height: free.height,
    });
  }

  // Right strip
  if (placed.x + placed.width < free.x + free.width) {
    result.push({
      x: placed.x + placed.width,
      y: free.y,
      width: free.x + free.width - (placed.x + placed.width),
      height: free.height,
    });
  }

  // Top strip
  if (placed.y > free.y) {
    result.push({
      x: free.x,
      y: free.y,
      width: free.width,
      height: placed.y - free.y,
    });
  }

  // Bottom strip
  if (placed.y + placed.height < free.y + free.height) {
    result.push({
      x: free.x,
      y: placed.y + placed.height,
      width: free.width,
      height: free.y + free.height - (placed.y + placed.height),
    });
  }

  return result;
}

/** Check if rect A is fully contained within rect B */
function isContainedIn(a: FreeRect, b: FreeRect): boolean {
  return (
    a.x >= b.x &&
    a.y >= b.y &&
    a.x + a.width <= b.x + b.width &&
    a.y + a.height <= b.y + b.height
  );
}
