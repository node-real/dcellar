import { useEffect } from 'react';

import { useSaveFuncRef } from '@/hooks/useSaveFuncRef';

export interface UseKeyDownProps {
  key?: string;
  ref?: any;
  handler: () => void;
}

export function useKeyDown({ ref, key = 'Enter', handler }: UseKeyDownProps) {
  const saveHandlerRef = useSaveFuncRef(handler);

  useEffect(() => {
    const el = ref.current ?? document;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === key) {
        saveHandlerRef.current?.();
        e.preventDefault();
      }
    };

    el.addEventListener('keydown', onKeyDown);
    return () => {
      el.removeEventListener('keydown', onKeyDown);
    };
  }, [key, ref, saveHandlerRef]);
}
