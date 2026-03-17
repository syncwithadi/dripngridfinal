'use client';

import { createContext, useContext, ReactNode } from 'react';

interface CurrencyContextType {
  formatPrice: (priceINR: number) => string;
  symbol: string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const formatPrice = (priceINR: number): string => {
    return `₹${priceINR.toLocaleString('en-IN')}`;
  };

  const symbol = '₹';

  return (
    <CurrencyContext.Provider value={{ formatPrice, symbol }}>
      {children}
    </CurrencyContext.Provider>
  );
}

// Default fallback values for when context is not available
const defaultCurrencyContext: CurrencyContextType = {
  formatPrice: (priceINR: number) => `₹${priceINR.toLocaleString('en-IN')}`,
  symbol: '₹',
};

export function useCurrency(): CurrencyContextType {
  const context = useContext(CurrencyContext);
  // Return default values instead of throwing during SSR/static generation
  if (context === undefined) {
    // Only warn in development, not during build
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.warn('useCurrency called outside of CurrencyProvider');
    }
    return defaultCurrencyContext;
  }
  return context;
}
