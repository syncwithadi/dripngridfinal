import type { Metadata } from 'next';
import { Inter, Playfair_Display, Outfit, Bodoni_Moda, Bebas_Neue } from 'next/font/google';
import '../globals.css';
import Navbar from '@/components/Navbar';
import PromoRibbon from '@/components/PromoRibbon';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import MaintenanceBanner from '@/components/MaintenanceBanner';
import { ThemeProvider } from '@/context/ThemeContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import AuthProvider from '@/context/AuthProvider';
import { sanityClient } from '@/sanity/client';
import { siteSettingsQuery } from '@/sanity/queries';
import TabTitleEffect from '@/components/TabTitleEffect';

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
  title: 'DRIPNGRID — Drip So Sharp, It Cuts.',
  description: 'DRIPNGRID is a premium fashion brand. Drip So Sharp, It Cuts.',
  keywords: ['DRIPNGRID', 'drip so sharp it cuts', 'premium fashion', 'streetwear', 'luxury essentials', 'minimal style'],
  authors: [{ name: 'DRIPNGRID' }],
  openGraph: {
    title: 'DRIPNGRID — Drip So Sharp, It Cuts.',
    description: 'DRIPNGRID is a premium fashion brand. Drip So Sharp, It Cuts.',
    type: 'website',
    locale: 'en_US',
    siteName: 'DRIPNGRID',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DRIPNGRID — Drip So Sharp, It Cuts.',
    description: 'DRIPNGRID is a premium fashion brand. Drip So Sharp, It Cuts.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch site settings server-side so the logo is available on first render
  // This eliminates the FOUC where text shows before the logo image loads
  let siteSettings: { brandLogo?: string; logoWidth?: number; siteName?: string } = {};
  try {
    siteSettings = await sanityClient.fetch(siteSettingsQuery) ?? {};
  } catch {
    // Silently fall back to text wordmark if Sanity is unavailable
  }

  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${outfit.variable} ${bodoni.variable} ${bebas.variable}`} suppressHydrationWarning>
      <body className="bg-[var(--color-bg)] text-[var(--color-text)] antialiased">
        <ThemeProvider>
          <AuthProvider>
            <CurrencyProvider>
              {/* Fixed Header Wrapper */}
              <div id="site-header" className="fixed top-0 left-0 right-0 z-[500]">
                <PromoRibbon />
                <Navbar
                  brandLogo={siteSettings.brandLogo}
                  logoWidth={siteSettings.logoWidth}
                  siteName={siteSettings.siteName}
                />
              </div>

              {/* Tab title cycling when user switches away */}
              <TabTitleEffect />

              {/* Cart Drawer */}
              <CartDrawer />

              {/* Maintenance notice — shows on every page load until launch */}
              <MaintenanceBanner />

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
