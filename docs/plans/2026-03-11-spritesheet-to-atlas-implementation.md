# Spritesheet to Atlas 實作計畫

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 建立一個純前端網頁工具，將 spritesheet 切割並轉換為 Cocos Creator / Unity 可用的 atlas 格式。

**Architecture:** Next.js App Router SPA，所有圖片處理在瀏覽器端完成。Canvas API 負責預覽與互動，Web Worker 處理自動偵測和 bin packing 等重度運算。狀態管理用 React context + useReducer 搭配 undo/redo 支援。

**Tech Stack:** Next.js 14+, TypeScript, Tailwind CSS, shadcn/ui, Canvas API, Web Worker, JSZip

---

### Task 1: 專案初始化與基礎設定

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

**Step 1: 建立 Next.js 專案**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --no-import-alias
```

**Step 2: 安裝 shadcn/ui**

```bash
npx shadcn@latest init
```
選擇：Default style, CSS variables, 預設設定。

**Step 3: 安裝額外依賴**

```bash
npm install jszip file-saver
npm install -D @types/file-saver
```

**Step 4: 安裝 shadcn/ui 元件**

```bash
npx shadcn@latest add button toggle tabs input label slider select tooltip
```

**Step 5: 確認專案可啟動**

```bash
npm run dev
```
Expected: localhost:3000 顯示預設 Next.js 頁面

**Step 6: Commit**

```bash
git add -A
git commit -m "初始化 Next.js 專案，安裝 Tailwind、shadcn/ui、JSZip"
```

---

### Task 2: Cyberpunk 主題系統

**Files:**
- Modify: `src/app/globals.css`
- Create: `src/components/theme-provider.tsx`
- Create: `src/components/theme-toggle.tsx`
- Modify: `src/app/layout.tsx`

**Step 1: 設定 CSS 變數 — dark (cyberpunk) 和 light 主題**

在 `globals.css` 中定義兩組 CSS 變數：

```css
:root {
  /* Light mode */
  --background: 0 0% 98%;
  --foreground: 240 10% 10%;
  --primary: 210 80% 50%;
  --primary-foreground: 0 0% 100%;
  --accent: 260 60% 55%;
  --accent-foreground: 0 0% 100%;
  --card: 0 0% 100%;
  --card-foreground: 240 10% 10%;
  --border: 220 13% 85%;
  --muted: 220 14% 96%;
  --muted-foreground: 220 9% 46%;
  --glow-primary: none;
  --glow-accent: none;
  --canvas-bg: 220 14% 92%;
}

.dark {
  /* Cyberpunk dark mode */
  --background: 240 60% 5%;
  --foreground: 180 100% 95%;
  --primary: 180 100% 50%;
  --primary-foreground: 240 60% 5%;
  --accent: 275 80% 62%;
  --accent-foreground: 0 0% 100%;
  --card: 240 40% 8%;
  --card-foreground: 180 100% 90%;
  --border: 240 40% 18%;
  --muted: 240 30% 12%;
  --muted-foreground: 240 10% 55%;
  --glow-primary: 0 0 8px hsl(180 100% 50% / 0.4), 0 0 20px hsl(180 100% 50% / 0.15);
  --glow-accent: 0 0 8px hsl(275 80% 62% / 0.4), 0 0 20px hsl(275 80% 62% / 0.15);
  --canvas-bg: 240 50% 6%;
}
```

**Step 2: 建立 ThemeProvider**

`src/components/theme-provider.tsx` — 使用 `next-themes` 套件：

```bash
npm install next-themes
```

```tsx
"use client";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      {children}
    </NextThemesProvider>
  );
}
```

**Step 3: 建立 ThemeToggle 元件**

`src/components/theme-toggle.tsx` — 右上角太陽/月亮 toggle 按鈕。使用 `useTheme()` hook 切換。

**Step 4: 更新 layout.tsx 加入 ThemeProvider 和字體**

引入 JetBrains Mono（等寬字體），套用 ThemeProvider 到 body。

**Step 5: 驗證主題切換**

手動測試：dark mode 呈現霓虹風格，light mode 呈現乾淨風格。

**Step 6: Commit**

```bash
git add -A
git commit -m "建立 Cyberpunk 主題系統，支援 dark/light mode 切換"
```

---

### Task 3: 核心型別定義與狀態管理

**Files:**
- Create: `src/types/index.ts`
- Create: `src/store/sprite-context.tsx`
- Create: `src/store/use-undo.ts`

**Step 1: 定義核心型別**

`src/types/index.ts`:

```typescript
export interface SpriteRect {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SpriteSheet {
  image: HTMLImageElement;
  fileName: string;
  width: number;
  height: number;
}

export type SplitMode = "grid" | "rectangular" | "datafile";

export interface GridSettings {
  cellWidth: number;
  cellHeight: number;
  offsetX: number;
  offsetY: number;
  spacing: number;
  filterEmpty: boolean;
}

export interface RectangularSettings {
  padding: number;
  alphaThreshold: number;
}

export type ExportEngine = "cocos" | "unity";
export type ExportMode = "original" | "repack";

export interface ExportSettings {
  engine: ExportEngine;
  mode: ExportMode;
  maxSize: 1024 | 2048 | 4096;
  padding: number;
  trim: boolean;
}

export type SpriteAction =
  | { type: "SET_SPRITES"; sprites: SpriteRect[] }
  | { type: "DELETE_SPRITE"; id: string }
  | { type: "UPDATE_SPRITE"; id: string; updates: Partial<SpriteRect> }
  | { type: "RENAME_SPRITE"; id: string; name: string };
```

**Step 2: 建立 undo/redo hook**

`src/store/use-undo.ts` — 管理 state 歷史紀錄的 custom hook，支援 `undo()`、`redo()`、`setState()`，最大紀錄 50 步。

**Step 3: 建立 SpriteContext**

`src/store/sprite-context.tsx` — React Context + useReducer，整合 undo hook。提供 `sprites`、`dispatch`、`undo`、`redo`、`canUndo`、`canRedo`。

**Step 4: 寫單元測試驗證 reducer 邏輯**

```bash
npm install -D vitest @testing-library/react
```

建立 `src/store/__tests__/sprite-reducer.test.ts`，測試 SET_SPRITES、DELETE_SPRITE、UPDATE_SPRITE、RENAME_SPRITE。

**Step 5: 執行測試**

```bash
npx vitest run src/store/__tests__/sprite-reducer.test.ts
```
Expected: All tests PASS

**Step 6: Commit**

```bash
git add -A
git commit -m "定義核心型別與 sprite 狀態管理（含 undo/redo）"
```

---

### Task 4: 圖片上傳元件

**Files:**
- Create: `src/components/image-uploader.tsx`
- Modify: `src/app/page.tsx`

**Step 1: 建立 ImageUploader 元件**

支援：
- 拖放（drag & drop）上傳
- 點擊選檔上傳
- 接受 `.png`, `.jpg`, `.webp` 格式
- 上傳後建立 `HTMLImageElement`，呼叫 `onImageLoaded(image, fileName)` callback
- Cyberpunk 風格：虛線邊框帶 glow，hover 時發光增強

**Step 2: 更新 page.tsx 呈現上傳元件**

條件式渲染：未上傳時顯示上傳區，上傳後顯示主編輯畫面。

**Step 3: 手動測試拖放和選檔上傳**

**Step 4: Commit**

```bash
git add -A
git commit -m "新增圖片上傳元件，支援拖放與選檔"
```

---

### Task 5: Canvas 預覽元件（縮放/平移）

**Files:**
- Create: `src/components/canvas-preview.tsx`
- Create: `src/hooks/use-canvas-transform.ts`

**Step 1: 建立 canvas transform hook**

`use-canvas-transform.ts` — 管理 canvas 的 zoom（滾輪）和 pan（中鍵/Space+拖曳）狀態。提供 `scale`、`offsetX`、`offsetY`、event handlers。

- 滾輪：縮放（0.1x ~ 10x）
- 中鍵拖曳或 Space+左鍵拖曳：平移
- 支援 Fit（自動縮放填滿）和 1:1 按鈕

**Step 2: 建立 CanvasPreview 元件**

- 接收 `image: HTMLImageElement` 和 `sprites: SpriteRect[]`
- 繪製底圖（棋盤格透明背景 + 圖片）
- 繪製 sprite 邊框（霓虹藍，選中時霓虹紫）
- 底部狀態列：圖片尺寸、sprite 數量、縮放百分比、Fit/1:1 按鈕

**Step 3: 整合到 page.tsx**

左側區域放 CanvasPreview。

**Step 4: 手動測試縮放平移**

**Step 5: Commit**

```bash
git add -A
git commit -m "新增 Canvas 預覽元件，支援縮放與平移"
```

---

### Task 6: 右側設定面板框架

**Files:**
- Create: `src/components/settings-panel.tsx`
- Modify: `src/app/page.tsx`

**Step 1: 建立 SettingsPanel 元件**

使用 shadcn Tabs 元件，三個 tab 對應三種切割模式：
- Grid
- Rectangular
- Data File

每個 tab 先放 placeholder 內容，後續 task 填入。

面板下方加入「輸出設定」區塊（引擎選擇、模式選擇、下載按鈕）。

**Step 2: 建立主頁面 layout**

`page.tsx` 整合所有元件：
```
┌─────────────────────────────────────────┐
│ Header (Logo + ThemeToggle)             │
├──────────────────────┬──────────────────┤
│                      │  Settings Panel  │
│   Canvas Preview     │  ┌─Tab─Tab─Tab─┐ │
│                      │  │ Grid params  │ │
│                      │  │              │ │
│                      │  ├──────────────┤ │
│                      │  │ Export opts  │ │
│                      │  │ [Download]   │ │
├──────────────────────┴──────────────────┤
│ Status Bar                              │
└─────────────────────────────────────────┘
```

**Step 3: 手動測試 layout 在不同視窗大小下的表現**

**Step 4: Commit**

```bash
git add -A
git commit -m "新增右側設定面板框架與主頁面 layout"
```

---

### Task 7: Grid 切割模式

**Files:**
- Create: `src/lib/split-grid.ts`
- Create: `src/lib/__tests__/split-grid.test.ts`
- Create: `src/components/grid-settings.tsx`

**Step 1: 寫 Grid 切割的測試**

```typescript
// split-grid.test.ts
import { splitGrid } from "../split-grid";

describe("splitGrid", () => {
  test("should split image into grid cells", () => {
    const result = splitGrid({
      imageWidth: 128,
      imageHeight: 128,
      cellWidth: 64,
      cellHeight: 64,
      offsetX: 0,
      offsetY: 0,
      spacing: 0,
      fileName: "test",
    });
    expect(result).toHaveLength(4);
    expect(result[0]).toMatchObject({ x: 0, y: 0, width: 64, height: 64, name: "test-0" });
  });

  test("should handle offset and spacing", () => {
    const result = splitGrid({
      imageWidth: 200,
      imageHeight: 100,
      cellWidth: 64,
      cellHeight: 64,
      offsetX: 10,
      offsetY: 10,
      spacing: 4,
      fileName: "sprite",
    });
    // 10 + 64 = 74, 74 + 4 + 64 = 142, 142 + 4 + 64 = 210 > 200 → 2 columns
    // 10 + 64 = 74, 74 + 4 + 64 = 142 > 100 → 1 row
    expect(result).toHaveLength(2);
  });
});
```

**Step 2: 執行測試確認失敗**

```bash
npx vitest run src/lib/__tests__/split-grid.test.ts
```

**Step 3: 實作 splitGrid 函式**

`src/lib/split-grid.ts` — 純函式，接收參數回傳 `SpriteRect[]`。

**Step 4: 執行測試確認通過**

**Step 5: 建立 GridSettings UI 元件**

`src/components/grid-settings.tsx` — 輸入 Cell Width/Height、Offset X/Y、Spacing。數值變更時即時呼叫 `splitGrid` 並更新 sprites。加入「過濾空白格」checkbox。

**Step 6: 整合到 SettingsPanel 的 Grid tab**

**Step 7: 手動測試：上傳圖片 → 設定 grid → Canvas 上即時顯示格線**

**Step 8: Commit**

```bash
git add -A
git commit -m "實作 Grid 切割模式，含參數設定與即時預覽"
```

---

### Task 8: Rectangular 自動偵測模式（Web Worker）

**Files:**
- Create: `src/workers/detect-sprites.worker.ts`
- Create: `src/lib/detect-sprites.ts`
- Create: `src/lib/__tests__/detect-sprites.test.ts`
- Create: `src/components/rectangular-settings.tsx`

**Step 1: 寫 connected component labeling 演算法的測試**

```typescript
// detect-sprites.test.ts
import { detectSprites } from "../detect-sprites";

describe("detectSprites", () => {
  test("should detect single opaque rectangle", () => {
    // 建立 10x10 的 alpha 陣列，中間 4x4 區域為不透明
    const width = 10;
    const height = 10;
    const alphaData = new Uint8Array(width * height).fill(0);
    for (let y = 3; y < 7; y++) {
      for (let x = 3; x < 7; x++) {
        alphaData[y * width + x] = 255;
      }
    }
    const result = detectSprites(alphaData, width, height, 0, 0);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ x: 3, y: 3, width: 4, height: 4 });
  });

  test("should detect multiple separate sprites", () => {
    const width = 20;
    const height = 10;
    const alphaData = new Uint8Array(width * height).fill(0);
    // 左邊 sprite
    for (let y = 1; y < 4; y++) for (let x = 1; x < 4; x++) alphaData[y * width + x] = 255;
    // 右邊 sprite
    for (let y = 1; y < 4; y++) for (let x = 15; x < 19; x++) alphaData[y * width + x] = 255;
    const result = detectSprites(alphaData, width, height, 0, 0);
    expect(result).toHaveLength(2);
  });
});
```

**Step 2: 執行測試確認失敗**

**Step 3: 實作 detectSprites**

`src/lib/detect-sprites.ts` — connected component labeling 使用 union-find 演算法：
1. 遍歷所有像素，alpha > threshold 的標記為前景
2. 對前景像素進行 4-connected labeling
3. 計算每個 label 的 bounding box
4. 返回 `SpriteRect[]`

此函式為純函式（接收 alpha 陣列），方便測試和在 Worker 中使用。

**Step 4: 執行測試確認通過**

**Step 5: 建立 Web Worker 封裝**

`src/workers/detect-sprites.worker.ts`:
- 接收 `{ imageData: Uint8ClampedArray, width, height, threshold, padding }` message
- 提取 alpha 通道 → 呼叫 `detectSprites` → postMessage 結果

**Step 6: 建立 RectangularSettings UI 元件**

`src/components/rectangular-settings.tsx` — Padding 和 Alpha Threshold 輸入。點擊「Detect」按鈕或參數變更時觸發 Worker 偵測。顯示 loading 狀態。

**Step 7: 整合到 SettingsPanel 的 Rectangular tab**

**Step 8: Commit**

```bash
git add -A
git commit -m "實作 Rectangular 自動偵測模式（Web Worker + connected component labeling）"
```

---

### Task 9: Data File 解析模式

**Files:**
- Create: `src/lib/parse-datafile.ts`
- Create: `src/lib/__tests__/parse-datafile.test.ts`
- Create: `src/components/datafile-settings.tsx`

**Step 1: 寫 datafile 解析的測試**

測試三種格式：
- TexturePacker JSON hash format
- TexturePacker XML
- Cocos Creator plist

每種格式準備一小段 fixture，驗證解析出正確的 `SpriteRect[]`。

**Step 2: 執行測試確認失敗**

**Step 3: 實作 parseDataFile**

`src/lib/parse-datafile.ts`:
- 自動偵測格式（JSON → parse JSON、XML/plist → DOMParser 解析）
- 支援 TexturePacker JSON（hash 和 array 格式）、TexturePacker XML、Cocos plist
- 回傳 `SpriteRect[]`

**Step 4: 執行測試確認通過**

**Step 5: 建立 DataFileSettings UI 元件**

`src/components/datafile-settings.tsx` — 檔案上傳按鈕，上傳後自動解析並顯示偵測到的 sprite 數量。

**Step 6: 整合到 SettingsPanel 的 Data File tab**

**Step 7: Commit**

```bash
git add -A
git commit -m "實作 Data File 解析模式，支援 TexturePacker JSON/XML 和 Cocos plist"
```

---

### Task 10: Sprite 微調互動

**Files:**
- Modify: `src/components/canvas-preview.tsx`
- Create: `src/components/sprite-list.tsx`
- Create: `src/hooks/use-sprite-interaction.ts`

**Step 1: 建立 sprite 互動 hook**

`use-sprite-interaction.ts` — 處理 Canvas 上的滑鼠事件：
- **Click**: hit test 判斷點擊了哪個 sprite，設為 selected
- **Drag on edge**: 偵測是否拖曳 sprite 邊框（8 個控制點），更新尺寸
- **Delete key**: 刪除選中的 sprite
- 將 screen 座標轉換為 image 座標（考慮 zoom/pan）

**Step 2: 更新 CanvasPreview**

- 選中的 sprite 用霓虹紫色邊框 + glow
- 顯示 8 個拖曳控制點（四角 + 四邊中點）
- 滑鼠移到邊框附近時顯示對應 resize cursor

**Step 3: 建立 SpriteList 面板元件**

`src/components/sprite-list.tsx` — 右側面板中列出所有 sprite：
- 顯示名稱、座標、尺寸
- 點擊可選取（Canvas 同步高亮）
- 雙擊名稱可編輯
- 刪除按鈕

**Step 4: 整合 undo/redo**

所有 sprite 操作（刪除、調整、重新命名）都透過 context dispatch，自動記錄 undo 歷史。加入 keyboard shortcut：Ctrl/Cmd+Z undo、Ctrl/Cmd+Shift+Z redo。

**Step 5: 手動測試所有互動**

**Step 6: Commit**

```bash
git add -A
git commit -m "實作 sprite 微調互動：選取、刪除、拖曳調整、重新命名、undo/redo"
```

---

### Task 11: Cocos Creator Plist 匯出

**Files:**
- Create: `src/lib/export-cocos.ts`
- Create: `src/lib/__tests__/export-cocos.test.ts`

**Step 1: 研究 Cocos Creator plist 格式**

參考文件：Cocos Creator SpriteFrame plist 格式。關鍵結構：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "...">
<plist version="1.0">
<dict>
  <key>frames</key>
  <dict>
    <key>sprite-0.png</key>
    <dict>
      <key>frame</key>
      <string>{{x,y},{w,h}}</string>
      <key>offset</key>
      <string>{0,0}</string>
      <key>rotated</key>
      <false/>
      <key>sourceColorRect</key>
      <string>{{0,0},{w,h}}</string>
      <key>sourceSize</key>
      <string>{w,h}</string>
    </dict>
  </dict>
  <key>metadata</key>
  <dict>
    <key>format</key>
    <integer>2</integer>
    <key>size</key>
    <string>{W,H}</string>
    <key>textureFileName</key>
    <string>atlas.png</string>
  </dict>
</dict>
</plist>
```

**Step 2: 寫匯出測試**

```typescript
import { exportCocosPlist } from "../export-cocos";

test("should generate valid plist", () => {
  const sprites = [
    { id: "1", name: "coin-0", x: 0, y: 0, width: 64, height: 64 },
    { id: "2", name: "coin-1", x: 64, y: 0, width: 64, height: 64 },
  ];
  const plist = exportCocosPlist(sprites, "coins.png", 128, 128);
  expect(plist).toContain("{{0,0},{64,64}}");
  expect(plist).toContain("coin-0.png");
  expect(plist).toContain("<key>format</key>");
});
```

**Step 3: 執行測試確認失敗**

**Step 4: 實作 exportCocosPlist**

`src/lib/export-cocos.ts` — 接收 sprites 和圖片資訊，產生 plist XML 字串。

**Step 5: 執行測試確認通過**

**Step 6: Commit**

```bash
git add -A
git commit -m "實作 Cocos Creator plist 匯出"
```

---

### Task 12: Unity .png.meta 匯出

**Files:**
- Create: `src/lib/export-unity.ts`
- Create: `src/lib/__tests__/export-unity.test.ts`

**Step 1: 研究 Unity .png.meta 格式**

Unity Sprite (Multiple) 的 .meta 檔關鍵結構（YAML）：

```yaml
fileFormatVersion: 2
guid: <random-hex-32>
TextureImporter:
  spriteMode: 2
  spriteSheet:
    sprites:
      - serializedVersion: 2
        name: sprite-0
        rect:
          serializedVersion: 2
          x: 0
          y: 0
          width: 64
          height: 64
        pivot: {x: 0.5, y: 0.5}
        border: {x: 0, y: 0, z: 0, w: 0}
  ...
```

注意：Unity 座標系 Y 軸是從底部往上。

**Step 2: 寫匯出測試**

```typescript
import { exportUnityMeta } from "../export-unity";

test("should generate valid unity meta with flipped Y", () => {
  const sprites = [
    { id: "1", name: "coin-0", x: 0, y: 0, width: 64, height: 64 },
  ];
  const meta = exportUnityMeta(sprites, "coins.png", 128, 128);
  expect(meta).toContain("spriteMode: 2");
  expect(meta).toContain("name: coin-0");
  // Y should be flipped: 128 - 0 - 64 = 64
  expect(meta).toContain("y: 64");
});
```

**Step 3: 執行測試確認失敗**

**Step 4: 實作 exportUnityMeta**

`src/lib/export-unity.ts` — 產生 YAML 格式的 .meta 檔字串。注意 Y 軸翻轉：`unityY = imageHeight - y - height`。產生隨機 GUID。

**Step 5: 執行測試確認通過**

**Step 6: Commit**

```bash
git add -A
git commit -m "實作 Unity .png.meta 匯出（含 Y 軸翻轉）"
```

---

### Task 13: 重新打包模式（Bin Packing）

**Files:**
- Create: `src/lib/bin-pack.ts`
- Create: `src/lib/__tests__/bin-pack.test.ts`
- Create: `src/workers/repack.worker.ts`
- Create: `src/lib/repack-atlas.ts`

**Step 1: 寫 bin packing 測試**

```typescript
import { maxRectsPack } from "../bin-pack";

test("should pack rectangles into bin", () => {
  const rects = [
    { id: "1", width: 64, height: 64 },
    { id: "2", width: 32, height: 32 },
    { id: "3", width: 48, height: 48 },
  ];
  const result = maxRectsPack(rects, 128, 128, 0);
  expect(result.packed).toHaveLength(3);
  result.packed.forEach((r) => {
    expect(r.x).toBeGreaterThanOrEqual(0);
    expect(r.y).toBeGreaterThanOrEqual(0);
    expect(r.x + r.width).toBeLessThanOrEqual(128);
    expect(r.y + r.height).toBeLessThanOrEqual(128);
  });
});

test("should report overflow when rects don't fit", () => {
  const rects = [{ id: "1", width: 256, height: 256 }];
  const result = maxRectsPack(rects, 128, 128, 0);
  expect(result.overflow).toHaveLength(1);
});
```

**Step 2: 執行測試確認失敗**

**Step 3: 實作 MaxRects bin packing**

`src/lib/bin-pack.ts` — MaxRects Best Short Side Fit 演算法：
- 維護一組 free rectangles
- 每次放入最合適的位置
- 支援 padding 參數

**Step 4: 執行測試確認通過**

**Step 5: 實作 repack-atlas**

`src/lib/repack-atlas.ts` — 組合功能：
1. 可選 trim 每個 sprite 的透明邊緣
2. 呼叫 bin-pack 取得新座標
3. 在 OffscreenCanvas 上繪製新的 atlas 圖片
4. 回傳新的圖片 blob + 新的 sprite 座標

**Step 6: 建立 Web Worker**

`src/workers/repack.worker.ts` — 封裝 repack-atlas，在 worker 中執行避免 UI 卡頓。

**Step 7: Commit**

```bash
git add -A
git commit -m "實作 MaxRects bin packing 與 atlas 重新打包"
```

---

### Task 14: 下載功能與匯出整合

**Files:**
- Create: `src/lib/export-download.ts`
- Create: `src/components/export-settings.tsx`

**Step 1: 實作匯出下載函式**

`src/lib/export-download.ts`:
1. 根據 ExportSettings 決定流程：
   - 原圖模式：取原圖 + 產生描述檔
   - Repack 模式：呼叫 repack worker → 取新圖 + 產生描述檔
2. 用 JSZip 打包成 .zip
3. 用 file-saver 觸發下載
4. 檔名格式：`{fileName}_{engine}.zip`

**Step 2: 建立 ExportSettings UI 元件**

`src/components/export-settings.tsx`:
- 引擎選擇：Cocos Creator / Unity（shadcn Select）
- 模式選擇：原圖 / 重新打包（shadcn Toggle）
- Repack 時顯示額外選項：Max Size、Padding、Trim
- 下載按鈕（帶 loading 狀態）

**Step 3: 整合到 SettingsPanel 下方**

**Step 4: 端對端手動測試**

測試完整流程：上傳圖片 → Grid 切割 → 選 Cocos → 下載 → 檢查 zip 內容。
測試完整流程：上傳圖片 → Rectangular 偵測 → 選 Unity → Repack → 下載 → 檢查 zip 內容。

**Step 5: Commit**

```bash
git add -A
git commit -m "實作匯出下載功能，整合 Cocos/Unity 匯出與 ZIP 打包"
```

---

### Task 15: 過濾空白格功能

**Files:**
- Create: `src/lib/filter-empty.ts`
- Create: `src/lib/__tests__/filter-empty.test.ts`
- Modify: `src/components/grid-settings.tsx`

**Step 1: 寫過濾測試**

```typescript
import { filterEmptySprites } from "../filter-empty";

test("should remove fully transparent sprites", () => {
  // 建立 imageData，其中某些 sprite 區域全透明
  // ...
});
```

**Step 2: 實作 filterEmptySprites**

接收 `ImageData` 和 `SpriteRect[]`，檢查每個 sprite 區域是否全透明（所有 alpha = 0），過濾掉空白的。

**Step 3: 執行測試確認通過**

**Step 4: 整合到 Grid 模式的「過濾空白格」checkbox**

**Step 5: Commit**

```bash
git add -A
git commit -m "實作過濾空白格功能"
```

---

### Task 16: 最終整合與 Polish

**Files:**
- Modify: 各元件微調
- Modify: `src/app/page.tsx`

**Step 1: 響應式調整**

- 確認小螢幕下 layout 合理（設定面板可能需要移到底部或 drawer）
- Canvas 自動 fit 到容器

**Step 2: Keyboard shortcuts 整合**

- `Ctrl/Cmd+Z`: Undo
- `Ctrl/Cmd+Shift+Z`: Redo
- `Delete/Backspace`: 刪除選中 sprite
- `Ctrl/Cmd+A`: 全選

**Step 3: 錯誤處理**

- 上傳非圖片檔的錯誤提示
- Data File 格式無法辨識的提示
- Repack 放不下的警告

**Step 4: 載入狀態**

- Worker 運算中顯示 loading indicator
- 匯出中顯示進度

**Step 5: 完整端對端測試**

所有三種切割模式 × 兩種輸出引擎 × 兩種匯出模式 = 12 種組合全部手動測試。

**Step 6: Commit**

```bash
git add -A
git commit -m "最終整合：響應式、keyboard shortcuts、錯誤處理、loading 狀態"
```
