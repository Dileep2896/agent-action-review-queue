'use client';
import { useReducedMotion } from 'motion/react';
import { useSyncExternalStore } from 'react';
const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;
/** Keep SSR and the first hydration render identical before applying the OS preference. */
export function useAccessibleMotion() {
  const reduced = useReducedMotion();
  const hydrated = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  return hydrated && Boolean(reduced);
}
