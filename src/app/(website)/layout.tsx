import type { Metadata } from 'next';
import { Inter, Playfair_Display, Outfit, Bodoni_Moda, Bebas_Neue } from 'next/font/google';
import Script from "next/script";
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

// Re-fetch site settings (logo, name, etc.) every 60 seconds
// so Sanity Studio changes appear on the live site quickly
export const revalidate = 60;

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

const DESCRIPTION = 'DRIPNGRID is a contemporary Gen Z fashion label defined by bold design, refined aesthetics, and premium craftsmanship.';

export const metadata: Metadata = {
  metadataBase: new URL('https://dripngrid.in'),
  title: 'DRIP N GRID',
  description: DESCRIPTION,
  keywords: ['DRIPNGRID', 'premium fashion', 'streetwear', 'luxury essentials', 'minimal style', 'Gen Z fashion', 'bold design'],
  authors: [{ name: 'DRIPNGRID' }],
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png' }],
    other: [
      { rel: 'android-chrome', url: '/android-chrome-192x192.png' },
      { rel: 'android-chrome', url: '/android-chrome-512x512.png' },
    ],
  },
  openGraph: {
    title: 'DRIP N GRID',
    description: DESCRIPTION,
    type: 'website',
    locale: 'en_US',
    siteName: 'DRIP N GRID',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DRIP N GRID',
    description: DESCRIPTION,
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

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://dripngrid.in/#organization',
        name: 'DRIPNGRID',
        url: 'https://dripngrid.in',
        logo: {
          '@type': 'ImageObject',
          url: 'https://dripngrid.in/images/logo.png',
          width: 300,
          height: 100,
        },
        sameAs: [
          'https://instagram.com/dripngrid',
          'https://x.com/dripngrid',
          'https://pinterest.com/dripngrid',
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          email: 'support@dripngrid.in',
          contactType: 'customer service',
        },
        founder: {
          '@type': 'Person',
          name: 'Aditya Choudhury',
        },
        foundingDate: '2026',
        description: 'DRIPNGRID is a contemporary Gen Z fashion label defined by bold design, refined aesthetics, and premium craftsmanship.',
      },
      {
        '@type': 'WebSite',
        '@id': 'https://dripngrid.in/#website',
        url: 'https://dripngrid.in',
        name: 'DRIPNGRID',
        publisher: { '@id': 'https://dripngrid.in/#organization' },
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://dripngrid.in/search?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };

  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${outfit.variable} ${bodoni.variable} ${bebas.variable}`} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
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
              <main className="pt-[96px]">
                 {children}
              </main>

              {/* Footer */}
              <Footer />
            </CurrencyProvider>
          </AuthProvider>
        </ThemeProvider>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-YPNDPVYWPQ"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-YPNDPVYWPQ');
          `}
        </Script>
      </body>
    </html>
  );
}
