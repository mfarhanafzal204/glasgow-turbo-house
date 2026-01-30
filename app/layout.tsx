import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SITE_CONFIG } from '@/lib/constants';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: SITE_CONFIG.name,
    template: `%s | ${SITE_CONFIG.business}`
  },
  description: SITE_CONFIG.description,
  keywords: SITE_CONFIG.keywords,
  authors: [{ name: SITE_CONFIG.author }],
  creator: SITE_CONFIG.author,
  publisher: SITE_CONFIG.business,
  
  // Enhanced Open Graph for social sharing
  openGraph: {
    type: 'website',
    locale: 'en_PK',
    url: SITE_CONFIG.url,
    title: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    siteName: SITE_CONFIG.business,
    images: [
      {
        url: `${SITE_CONFIG.url}/logo.jpg`,
        width: 1200,
        height: 630,
        alt: `${SITE_CONFIG.business} - Top Turbo Dealers in Multan Pakistan`,
      },
    ],
  },
  
  // Enhanced Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: SITE_CONFIG.name,
    description: SITE_CONFIG.shortDescription,
    images: [`${SITE_CONFIG.url}/logo.jpg`],
    creator: '@glasgowturbo',
  },
  
  // Enhanced robots configuration
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // Canonical URL
  alternates: {
    canonical: SITE_CONFIG.url,
  },
  
  // Enhanced verification
  verification: {
    google: 'wj6W8HNpXfqZtz2JLJXJxkHZkUEUI4XtxqiOJ5RBlFY',
    yandex: 'glasgow-turbo-house-yandex',
    yahoo: 'glasgow-turbo-house-yahoo',
  },
  
  // Additional metadata for better SEO
  category: 'Automotive Parts & Services',
  classification: 'Business',
  referrer: 'origin-when-cross-origin',
  
  // App-specific metadata
  applicationName: SITE_CONFIG.business,
  generator: 'Next.js',
  
  // Additional Open Graph properties
  other: {
    'og:phone_number': SITE_CONFIG.phone,
    'og:email': SITE_CONFIG.email,
    'og:street-address': SITE_CONFIG.address,
    'og:locality': SITE_CONFIG.city,
    'og:region': SITE_CONFIG.state,
    'og:postal-code': SITE_CONFIG.postalCode,
    'og:country-name': SITE_CONFIG.country,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#0ea5e9" />
      </head>
      <body className={inter.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": "Glasgow Turbo House (GDS)",
              "alternateName": ["GDS", "Glasgow Diesel Service"],
              "description": "Pakistan's #1 turbo ecommerce store by Muhammad Afzal. Top turbo sellers in Multan offering professional turbo parts, diesel services & turbo installation.",
              "url": "https://glasgowturbo.com",
              "telephone": "+923006348406",
              "email": "glassgoww1@gmail.com",
              "founder": {
                "@type": "Person",
                "name": "Muhammad Afzal"
              },
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "SHOP 122-H General Bus Stand",
                "addressLocality": "Multan",
                "addressCountry": "Pakistan"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": "30.1575",
                "longitude": "71.5249"
              },
              "openingHours": [
                "Mo-Th 07:00-20:00",
                "Sa-Su 07:00-20:00"
              ],
              "priceRange": "$$",
              "servesCuisine": "Automotive",
              "serviceArea": {
                "@type": "Country",
                "name": "Pakistan"
              },
              "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Turbo Parts & Services",
                "itemListElement": [
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Product",
                      "name": "Turbochargers",
                      "category": "Automotive Parts"
                    }
                  },
                  {
                    "@type": "Offer", 
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Turbo Installation",
                      "category": "Automotive Service"
                    }
                  }
                ]
              },
              "sameAs": [
                "https://www.facebook.com/glassgowturbo"
              ]
            })
          }}
        />
        {children}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  );
}