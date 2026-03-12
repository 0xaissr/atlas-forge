"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Trash2, ChevronDown } from "lucide-react";
import { useSprites } from "@/store/sprite-context";

interface SpriteListProps {
  selectedSpriteId: string | null;
  setSelectedSpriteId: (id: string | null) => void;
}

export function SpriteList({
  selectedSpriteId,
  setSelectedSpriteId,
}: SpriteListProps) {
  const { sprites, dispatch } = useSprites();
  const [collapsed, setCollapsed] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to selected item
  useEffect(() => {
    if (selectedSpriteId && selectedRef.current) {
      selectedRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedSpriteId]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleDoubleClick = useCallback((id: string, name: string) => {
    setEditingId(id);
    setEditValue(name);
  }, []);

  const commitRename = useCallback(() => {
    if (editingId && editValue.trim()) {
      dispatch({ type: "RENAME_SPRITE", id: editingId, name: editValue.trim() });
    }
    setEditingId(null);
  }, [editingId, editValue, dispatch]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        commitRename();
      } else if (e.key === "Escape") {
        setEditingId(null);
      }
    },
    [commitRename]
  );

  const handleDelete = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      dispatch({ type: "DELETE_SPRITE", id });
      if (selectedSpriteId === id) {
        setSelectedSpriteId(null);
      }
    },
    [dispatch, selectedSpriteId, setSelectedSpriteId]
  );

  return (
    <div className="flex flex-col">
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="flex items-center justify-between px-3 py-2 text-xs font-medium text-primary hover:bg-accent/50 transition-colors"
      >
        <span>Sprites ({sprites.length})</span>
        <ChevronDown className={`size-3.5 transition-transform ${collapsed ? "-rotate-90" : ""}`} />
      </button>
      {!collapsed && sprites.length === 0 && (
        <div className="p-3 text-center text-xs text-muted-foreground">
          尚無 Sprite 資料
        </div>
      )}
      <div className={`overflow-y-auto flex-1 ${collapsed ? "hidden" : ""}`}>
        {sprites.map((sprite) => {
          const isSelected = sprite.id === selectedSpriteId;
          const isEditing = sprite.id === editingId;

          return (
            <div
              key={sprite.id}
              ref={isSelected ? selectedRef : undefined}
              onClick={() => setSelectedSpriteId(sprite.id)}
              onDoubleClick={() => handleDoubleClick(sprite.id, sprite.name)}
              className={`
                group flex items-center gap-2 px-3 py-1.5 cursor-pointer border-b border-border/50
                transition-colors text-xs
                ${isSelected
                  ? "bg-primary/10 text-foreground border-l-2 border-l-primary"
                  : "hover:bg-accent/50 text-muted-foreground border-l-2 border-l-transparent"
                }
              `}
            >
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <input
                    ref={inputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-background border border-border rounded px-1 py-0.5 text-xs text-foreground outline-none focus:border-primary"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div className="truncate font-medium">{sprite.name}</div>
                )}
                <div className="text-[10px] text-muted-foreground/70 font-mono">
                  ({sprite.x}, {sprite.y}) {sprite.width}&times;{sprite.height}
                </div>
              </div>
              <button
                onClick={(e) => handleDelete(sprite.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/20 hover:text-destructive transition-all"
                title="刪除 Sprite"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
