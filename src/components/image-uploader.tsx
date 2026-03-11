"use client";

import { useCallback, useRef, useState } from "react";

interface ImageUploaderProps {
  onImageLoaded: (image: HTMLImageElement, fileName: string) => void;
}

const ACCEPTED_FORMATS = ".png,.jpg,.jpeg,.webp";
const ACCEPTED_MIME = ["image/png", "image/jpeg", "image/webp"];

export function ImageUploader({ onImageLoaded }: ImageUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!ACCEPTED_MIME.includes(file.type)) {
        setError(`不支援的檔案格式：${file.name}。請使用 PNG、JPG 或 WebP 格式。`);
        return;
      }

      setError(null);
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        onImageLoaded(img, file.name);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        setError(`無法載入圖片：${file.name}`);
      };
      img.src = url;
    },
    [onImageLoaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleClick = () => inputRef.current?.click();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        flex cursor-pointer flex-col items-center justify-center
        rounded-lg border-2 border-dashed p-12
        transition-all duration-200
        ${
          isDragOver
            ? "border-primary bg-primary/5 shadow-[var(--glow-primary)]"
            : "border-border hover:border-primary/60 hover:shadow-[var(--glow-primary)]"
        }
      `}
    >
      {/* Upload icon */}
      <svg
        className="mb-4 h-12 w-12 text-muted-foreground"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
        />
      </svg>

      <p className="mb-1 text-lg font-medium text-foreground">
        拖放圖片到這裡，或點擊選擇檔案
      </p>
      <p className="text-sm text-muted-foreground">
        支援格式：PNG、JPG、JPEG、WebP
      </p>

      {error && (
        <p className="mt-2 text-sm font-medium text-destructive">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_FORMATS}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
