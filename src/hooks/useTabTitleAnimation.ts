'use client';

import { useEffect, useRef } from 'react';

const AWAY_MESSAGES = [
  '👋 Come back!',
  '🩷 We miss you!',
  '🔥 Don\'t miss out!',
  '✨ New drops waiting…',
  '⚡ Come see what\'s new!',
];

const ORIGINAL_TITLE = 'DRIPNGRID — Drip So Sharp, It Cuts.';
const INTERVAL_MS    = 2000;

export function useTabTitleAnimation() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const idxRef      = useRef(0);

  useEffect(() => {
    const startAnimation = () => {
      idxRef.current = 0;
      intervalRef.current = setInterval(() => {
        document.title = AWAY_MESSAGES[idxRef.current % AWAY_MESSAGES.length];
        idxRef.current++;
      }, INTERVAL_MS);
    };

    const stopAnimation = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      document.title = ORIGINAL_TITLE;
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        startAnimation();
      } else {
        stopAnimation();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopAnimation();
    };
  }, []);
}
