import type { SpriteRect } from "../types";

/**
 * Connected Component Labeling using Union-Find to detect sprites
 * from alpha channel data.
 *
 * Pure function — no DOM or Worker dependencies.
 */
export function detectSprites(
  alphaData: Uint8Array,
  width: number,
  height: number,
  alphaThreshold: number,
  padding: number
): SpriteRect[] {
  const totalPixels = width * height;
  const labels = new Int32Array(totalPixels).fill(-1);
  const parent = new Int32Array(totalPixels);
  const rank = new Int32Array(totalPixels);

  // Initialize union-find
  for (let i = 0; i < totalPixels; i++) {
    parent[i] = i;
  }

  function find(x: number): number {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]]; // path compression
      x = parent[x];
    }
    return x;
  }

  function union(a: number, b: number): void {
    const ra = find(a);
    const rb = find(b);
    if (ra === rb) return;
    if (rank[ra] < rank[rb]) {
      parent[ra] = rb;
    } else if (rank[ra] > rank[rb]) {
      parent[rb] = ra;
    } else {
      parent[rb] = ra;
      rank[ra]++;
    }
  }

  // First pass: assign labels and union neighbors
  let nextLabel = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (alphaData[idx] <= alphaThreshold) continue;

      labels[idx] = nextLabel++;

      // Check left neighbor
      if (x > 0) {
        const leftIdx = idx - 1;
        if (labels[leftIdx] >= 0) {
          union(labels[idx], labels[leftIdx]);
        }
      }

      // Check top neighbor
      if (y > 0) {
        const topIdx = idx - width;
        if (labels[topIdx] >= 0) {
          union(labels[idx], labels[topIdx]);
        }
      }
    }
  }

  // Second pass: compute bounding boxes per root label
  const bboxes = new Map<
    number,
    { minX: number; minY: number; maxX: number; maxY: number }
  >();

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (labels[idx] < 0) continue;

      const root = find(labels[idx]);
      const box = bboxes.get(root);
      if (box) {
        box.minX = Math.min(box.minX, x);
        box.minY = Math.min(box.minY, y);
        box.maxX = Math.max(box.maxX, x);
        box.maxY = Math.max(box.maxY, y);
      } else {
        bboxes.set(root, { minX: x, minY: y, maxX: x, maxY: y });
      }
    }
  }

  // Convert to SpriteRect[] with padding
  const sprites: SpriteRect[] = [];
  for (const box of bboxes.values()) {
    const x = Math.max(0, box.minX - padding);
    const y = Math.max(0, box.minY - padding);
    const right = Math.min(width - 1, box.maxX + padding);
    const bottom = Math.min(height - 1, box.maxY + padding);

    sprites.push({
      id: "", // will be assigned after sorting
      name: "", // will be assigned after sorting
      x,
      y,
      width: right - x + 1,
      height: bottom - y + 1,
    });
  }

  // Sort top-to-bottom, left-to-right
  sprites.sort((a, b) => a.y - b.y || a.x - b.x);

  // Assign IDs and names
  sprites.forEach((sprite, index) => {
    sprite.id = `rect-${index}`;
    sprite.name = `sprite-${index}`;
  });

  return sprites;
}
