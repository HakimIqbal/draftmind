'use client';
import { useEffect } from 'react';

type KeyHandler = (e: KeyboardEvent) => void;

export function useKeyboard(shortcuts: Record<string, KeyHandler>) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const key = [
        e.metaKey || e.ctrlKey ? 'mod' : '',
        e.shiftKey ? 'shift' : '',
        e.key.toLowerCase(),
      ]
        .filter(Boolean)
        .join('+');

      const fn = shortcuts[key];
      if (fn) {
        e.preventDefault();
        fn(e);
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts]);
}
