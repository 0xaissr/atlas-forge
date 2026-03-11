"use client";

import React, { createContext, useCallback, useContext } from "react";
import type { SpriteAction, SpriteRect } from "@/types";
import { useUndo } from "./use-undo";

export function spriteReducer(
  state: SpriteRect[],
  action: SpriteAction
): SpriteRect[] {
  switch (action.type) {
    case "SET_SPRITES":
      return action.sprites;

    case "DELETE_SPRITE":
      return state.filter((s) => s.id !== action.id);

    case "UPDATE_SPRITE":
      return state.map((s) =>
        s.id === action.id ? { ...s, ...action.updates } : s
      );

    case "RENAME_SPRITE":
      return state.map((s) =>
        s.id === action.id ? { ...s, name: action.name } : s
      );

    default:
      return state;
  }
}

interface SpriteContextValue {
  sprites: SpriteRect[];
  dispatch: (action: SpriteAction) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const SpriteContext = createContext<SpriteContextValue | null>(null);

export function SpriteProvider({ children }: { children: React.ReactNode }) {
  const { state: sprites, setState, undo, redo, canUndo, canRedo } =
    useUndo<SpriteRect[]>([]);

  const dispatch = useCallback(
    (action: SpriteAction) => {
      setState(spriteReducer(sprites, action));
    },
    [sprites, setState]
  );

  return (
    <SpriteContext.Provider
      value={{ sprites, dispatch, undo, redo, canUndo, canRedo }}
    >
      {children}
    </SpriteContext.Provider>
  );
}

export function useSprites(): SpriteContextValue {
  const ctx = useContext(SpriteContext);
  if (!ctx) {
    throw new Error("useSprites must be used within a SpriteProvider");
  }
  return ctx;
}
