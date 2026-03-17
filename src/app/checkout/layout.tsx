// Minimal layout for checkout — no PromoRibbon, Navbar, or Footer
import type { Metadata } from 'next';
import { Inter, Outfit, Bodoni_Moda } from 'next/font/google';
import '../globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import AuthProvider from '@/context/AuthProvider';

const inter = Inter({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const bodoni = Bodoni_Moda({ subsets: ['latin'], variable: '--font-luxury', display: 'swap' });

export const metadata: Metadata = {
  title: 'Checkout | DRIPNGRID',
  description: 'Secure checkout at DRIPNGRID',
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} ${bodoni.variable}`}>
      <body className="bg-white text-gray-900 antialiased">
        <ThemeProvider>
          <AuthProvider>
            <CurrencyProvider>
              {children}
            </CurrencyProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
