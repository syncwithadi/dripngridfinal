'use client';

import { ReactNode } from 'react';

// Light-only theme — dark mode has been removed.
// ThemeProvider is kept as a pass-through wrapper so existing layout imports don't break.

export function ThemeProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

// useTheme kept for backward compatibility — always returns 'light'
export function useTheme() {
  return {
    theme: 'light' as const,
    toggleTheme: () => {},
    setTheme: () => {},
  };
}
