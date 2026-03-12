# AtlasForge — Spritesheet to Atlas Converter

將 spritesheet 切割並匯出為 Cocos Creator (.plist) 或 Unity (.png.meta) 的 texture atlas。

## 功能

- **Rect 自動偵測** — 自動辨識 sprite 邊界，支援背景色取樣
- **Grid 切割** — 等寬等高格線切割，支援 offset 和 spacing
- **Data File 匯入** — 支援 TexturePacker JSON 和 Cocos plist 格式
- **動畫預覽** — 逐幀播放、timeline 縮圖拖拽排序
- **Repack 模式** — MaxRects BSSF bin packing，BestFit 自動尺寸
- **多檔案頁籤** — 同時編輯多個 spritesheet
- **Cyberpunk 主題** — 深色/淺色模式切換

## Tech Stack

- Next.js 16 + TypeScript + Tailwind CSS + shadcn/ui
- Pure client-side rendering
- Canvas API + Vitest

## 使用

```bash
npm install
npm run dev
```

## 打包部署

```bash
npx next build
# 靜態檔案產出在 out/ 資料夾
cd out && python3 -m http.server 8080
```
