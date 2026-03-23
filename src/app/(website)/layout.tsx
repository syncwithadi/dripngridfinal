import type { Metadata } from 'next';
import { Inter, Playfair_Display, Outfit, Bodoni_Moda, Bebas_Neue } from 'next/font/google';
import '../globals.css';
import Navbar from '@/components/Navbar';
import PromoRibbon from '@/components/PromoRibbon';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { ThemeProvider } from '@/context/ThemeContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import AuthProvider from '@/context/AuthProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const bodoni = Bodoni_Moda({
  subsets: ['latin'],
  variable: '--font-luxury',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const bebas = Bebas_Neue({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-bebas',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DRIPNGRID | Premium Fashion',
  description: 'Premium fashion essentials crafted for the discerning individual. Timeless pieces that define understated elegance.',
  keywords: ['premium fashion', 'luxury essentials', 'minimal style', 'contemporary fashion', 'DRIPNGRID'],
  authors: [{ name: 'DRIPNGRID' }],
  openGraph: {
    title: 'DRIPNGRID | Premium Fashion',
    description: 'Premium fashion essentials crafted for the discerning individual. Timeless pieces that define understated elegance.',
    type: 'website',
    locale: 'en_US',
    siteName: 'DRIPNGRID',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DRIPNGRID | Premium Fashion',
    description: 'Premium fashion essentials crafted for the discerning individual.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${outfit.variable} ${bodoni.variable} ${bebas.variable}`}>
      <body className="bg-[var(--color-bg)] text-[var(--color-text)] antialiased">
        <ThemeProvider>
          <AuthProvider>
            <CurrencyProvider>
              {/* Fixed Header Wrapper */}
              <div className="fixed top-0 left-0 right-0 z-[500]">
                <PromoRibbon />
                <Navbar />
              </div>

              {/* Cart Drawer */}
              <CartDrawer />

              {/* Main Content - padding for fixed header (PromoRibbon ~36px + Navbar 56px/60px) */}
              <main className="page-transition pt-[96px]">
                {children}
              </main>

              {/* Footer */}
              <Footer />
            </CurrencyProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
