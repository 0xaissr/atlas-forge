# Spritesheet to Atlas - 設計文件

## 概述

一個純前端網頁工具，可將 spritesheet 切割並轉換為 Cocos Creator 或 Unity 可用的 atlas 格式。參考 TexturePacker 的 Split Sheet 功能，但輸出的是引擎可直接使用的 atlas 描述檔。

## 技術棧

- Next.js 14+ (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Canvas API（圖片處理與預覽）
- Web Worker（背景運算：自動偵測、bin packing）
- JSZip（打包下載）
- 部署：Vercel / Netlify 靜態託管

## 使用者流程

```
上傳 Spritesheet（拖放或選檔）
        ↓
選擇切割模式（Grid / Rectangular / Data File）
        ↓
    預覽 & 微調
  ├─ 藍框標示每個 sprite
  ├─ 可刪除不要的 sprite
  ├─ 可拖曳調整邊界
  └─ 可重新命名（預設: 檔名-{n}）
        ↓
    輸出設定
  ├─ 選擇引擎（Cocos Creator / Unity）
  ├─ 選擇模式（原圖+描述檔 / 重新打包）
  └─ Padding / Trim 等進階設定
        ↓
      下載 ZIP
  └─ 圖片 + 對應格式的描述檔
```

## 頁面結構

單頁應用，不需要路由。

- **左側**：圖片預覽區（Canvas，支援縮放/平移）
- **右側**：設定面板（切割模式、參數、輸出格式）
- **底部**：狀態列（圖片尺寸、sprite 數量、縮放比例）

## 切割模式

### Grid 模式

- 使用者輸入 Cell Width 和 Cell Height（像素）
- 可選設定 Offset X/Y（起始偏移）和 Spacing（格線間距）
- 即時在 Canvas 上畫出格線預覽
- 自動過濾全透明的格子（可開關）

### Rectangular 模式（自動偵測）

- 掃描圖片透明通道（alpha），用 connected component labeling 演算法偵測每個 sprite 的 bounding box
- 可設定 Padding（向外擴展偵測框）和 Alpha Threshold（低於多少算透明，預設 0）
- 演算法在 Web Worker 中執行，避免阻塞 UI

### Data File 模式

- 上傳已有的描述檔（支援 JSON / XML / .plist）
- 自動辨識常見格式：TexturePacker JSON/XML、Cocos plist、Unity JSON
- 解析出每個 sprite 的座標和尺寸

## 微調功能

切割完成後，所有 sprite 以藍色邊框顯示在 Canvas 上：

- **點擊** sprite 可選取（高亮顯示）
- **Delete 鍵**或右鍵選單刪除不需要的 sprite
- **拖曳邊框**調整個別 sprite 的邊界
- **雙擊**或在右側面板修改 sprite 名稱（預設 `{filename}-{n}`）
- 支援 **Ctrl+Z / Cmd+Z** 復原操作

## 輸出格式

### Cocos Creator（.plist）

- XML 格式的 .plist 檔，符合 Cocos Creator SpriteFrame 規範
- 包含每個 sprite 的：frame、offset、sourceSize、rotated 等屬性
- 支援 trimmed sprite 資訊

### Unity（.png.meta）

- .png + .png.meta 檔（YAML 格式）
- meta 檔中定義 spriteSheet 區塊，包含每個 sprite 的 name、rect、pivot、border
- 匯入 Unity 後自動識別為 Sprite (Multiple) 模式

## 輸出模式

### 原圖模式

- 不改動 spritesheet 圖片
- 只產生對應引擎的描述檔，座標對應到原圖

### 重新打包模式（Repack）

- 用 MaxRects bin packing 演算法重新排列 sprite
- 產生新的 atlas 圖片（可設定最大尺寸：1024/2048/4096）
- 自動 trim 每個 sprite 的透明邊緣（可開關）
- 加入 padding 避免邊緣出血（可設定 0-4 px）

## 下載

- 打包成 .zip，包含圖片和描述檔
- 檔名格式：`{原始檔名}_{引擎名}.zip`

## 命名規則

- 預設：`{上傳檔名}-{n}`（n 從 0 開始）
- 使用者可修改個別 sprite 名稱

## 視覺風格

### Cyberpunk Dark Mode（預設）

- 深色底色：近黑色帶微微藍/紫色調（`#0a0a1a`）
- 主色調：霓虹藍/青色（`#00f0ff`）
- 次色調：霓虹紫/粉（`#b347ea`）
- 邊框/格線：半透明霓虹色發光效果（box-shadow glow）
- 字體：等寬字體用於數值和標籤（JetBrains Mono / Space Mono），UI 文字用無襯線字體
- 按鈕/面板：半透明深色背景 + 微發光邊框，hover 時 glow 增強
- Sprite 選取框：霓虹藍邊框帶 glow，選中時切換為霓虹紫
- 動效克制：按鈕 hover glow 過渡、sprite 框淡入

### Light Mode

- 白/淺灰背景
- 主色調改為低飽和度藍色
- 邊框和選取框改為實色（無 glow）
- 保持相同 layout 和功能

### 主題切換

- 右上角 toggle 開關（太陽/月亮 icon）
- localStorage 儲存使用者偏好
