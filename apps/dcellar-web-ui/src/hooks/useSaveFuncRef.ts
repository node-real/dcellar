import { useRef } from 'react';

export function useSaveFuncRef<T>(func: T) {
  const ref = useRef<T>();
  ref.current = func;
  return ref;
}
