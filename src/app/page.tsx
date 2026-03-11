"use client";

import { useState, useCallback } from "react";
import { ImageUploader } from "@/components/image-uploader";

export default function Home() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState("");

  const handleImageLoaded = useCallback(
    (img: HTMLImageElement, name: string) => {
      setImage(img);
      setFileName(name);
    },
    []
  );

  if (!image) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-8">
        <div className="w-full max-w-xl">
          <h1 className="mb-8 text-center text-3xl font-bold text-foreground">
            Spritesheet to Atlas
          </h1>
          <ImageUploader onImageLoaded={handleImageLoaded} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8">
      <h1 className="text-2xl font-bold text-foreground">
        Spritesheet to Atlas
      </h1>
      <div className="rounded-lg border border-border bg-card p-6 shadow-[var(--glow-primary)]">
        <p className="text-sm text-muted-foreground">檔案名稱</p>
        <p className="mb-2 text-lg font-medium text-foreground">{fileName}</p>
        <p className="text-sm text-muted-foreground">尺寸</p>
        <p className="text-lg font-medium text-foreground">
          {image.naturalWidth} x {image.naturalHeight} px
        </p>
      </div>
    </div>
  );
}
