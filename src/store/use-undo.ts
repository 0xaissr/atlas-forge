import { useCallback, useRef, useState } from "react";

const MAX_HISTORY = 50;

export interface UndoState<T> {
  state: T;
  setState: (newState: T) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function useUndo<T>(initialState: T): UndoState<T> {
  const [state, setInternalState] = useState<T>(initialState);
  const pastRef = useRef<T[]>([]);
  const futureRef = useRef<T[]>([]);

  const setState = useCallback(
    (newState: T) => {
      setInternalState((current) => {
        pastRef.current = [...pastRef.current, current].slice(-MAX_HISTORY);
        futureRef.current = [];
        return newState;
      });
    },
    []
  );

  const undo = useCallback(() => {
    setInternalState((current) => {
      if (pastRef.current.length === 0) return current;
      const previous = pastRef.current[pastRef.current.length - 1];
      pastRef.current = pastRef.current.slice(0, -1);
      futureRef.current = [current, ...futureRef.current];
      return previous;
    });
  }, []);

  const redo = useCallback(() => {
    setInternalState((current) => {
      if (futureRef.current.length === 0) return current;
      const next = futureRef.current[0];
      futureRef.current = futureRef.current.slice(1);
      pastRef.current = [...pastRef.current, current];
      return next;
    });
  }, []);

  return {
    state,
    setState,
    undo,
    redo,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
  };
}
