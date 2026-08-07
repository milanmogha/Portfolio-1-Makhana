import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import "./src/index.css";
import "./src/css/ui-components.css";
import "./src/css/BuildYourBox.css";
import "./src/css/CategoriesPage.css";
import "./src/css/AddressBook.css";
import "./src/css/CartSlider.css";
import "./src/css/CheckoutPage.css";
import "./src/css/ConfirmationModal.css";
import "./src/css/FilterSidebar.css";
import "./src/css/Footer.css";
import "./src/css/HomePage.css";
import "./src/css/Login.css";
import "./src/css/MyAccount.css";
import "./src/css/Navbar.css";
import "./src/css/OrderDetailsPage.css";
import "./src/css/OrderTracker.css";
import "./src/css/OrdersPage.css";
import "./src/css/ProductCard.css";
import "./src/css/ProductDetails.css";
import "./src/css/ProductPage.css";
import "./src/css/ReviewForm.css";
import "./src/css/ReviewList.css";
import "./src/css/WishList.css";
// NOTE(Phase 5): react-slick/slick-carousel no longer used — CSS scroll-snap
// carousels replaced them. Run `npm uninstall react-slick slick-carousel
// firebase` on the host to drop the deps (sandbox can't delete node_modules).

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://makhanahealthking.com"),
  title: "Makhana E-Store | Premium Quality Fox Nuts Online",
  description: "Discover premium quality Makhana (fox nuts) at Makhana E-Store. Shop flavored, plain, mixes & gift boxes. Healthy snacking delivered to your door. ✓ Free shipping available.",
  keywords: "makhana, fox nuts, healthy snacks, organic makhana, flavored makhana, plain makhana, makhana mixes, dry fruits, gift boxes",
  authors: [{ name: "Makhana E-Store" }],
  creator: "Makhana E-Store",
  publisher: "Makhana E-Store",
  formatDetection: {
    email: false,
    telephone: false,
    address: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      // Extensions fixed — actual files are icon0.svg / icon1.png
      { url: '/icon1.png', sizes: '96x96', type: 'image/png' }, // Critical for Google
      { url: '/icon0.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-icon.png' },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://makhanahealthking.com",
    siteName: "Makhana E-Store",
    title: "Makhana E-Store | Premium Quality Fox Nuts Online",
    description: "Discover premium quality Makhana (fox nuts). Shop flavored, plain, mixes & gift boxes. Healthy snacking delivered to your door.",
    images: [
      {
        url: "https://makhanahealthking.com/makhana.png",
        width: 1200,
        height: 630,
        alt: "Makhana E-Store - Premium Fox Nuts",
        type: "image/png",
      },
      {
        url: "https://makhanahealthking.com/web-app-manifest-512x512.png",
        width: 512,
        height: 512,
        alt: "Makhana E-Store Logo",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Makhana E-Store | Premium Quality Fox Nuts",
    description: "Shop premium makhana (fox nuts) - flavored, plain, mixes & more. Delivered to your door.",
    images: ["https://makhanahealthking.com/makhana.png"],
    creator: "@makhanahealthking",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: "https://makhanahealthking.com",
  },
  appleWebApp: {
    capable: true,
    title: "Makhana E-Store",
    statusBarStyle: "default",
  },
  verification: {
    google: "_ldbydo7nvnbPnqKQnLFzrjKwjqBgKj9AZzO8XS9cBw", // Add your actual verification code
    other: {
      "msvalidate.01": "your-bing-verification-code", // Add your actual Bing verification code
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Canonical URL */}
        <link rel="canonical" href="https://makhanahealthking.com" />

        {/* Preload Critical Resources */}
        <link rel="preload" as="image" href="/makhana.png" />

        {/* DNS Prefetch for Performance */}
        <link rel="dns-prefetch" href="https://makhanahealthking.com" />

        {/* Additional Meta Tags for SEO */}
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta httpEquiv="x-ua-compatible" content="ie=edge" />
        <meta name="theme-color" content="#1B4D3E" />

        {/* JSON-LD Schema Markup */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Makhana E-Store',
              url: 'https://makhanahealthking.com',
              logo: 'https://makhanahealthking.com/web-app-manifest-512x512.png',
              description: 'Premium quality makhana (fox nuts) online store',
              contactPoint: {
                '@type': 'ContactPoint',
                telephone: '[your-phone-number]',
                contactType: 'Customer Service',
              },
              sameAs: [
                'https://www.facebook.com/makhanahealthking',
                'https://www.instagram.com/makhanahealthking',
                'https://www.twitter.com/makhanahealthking',
              ],
            }),
          }}
        />

        {/* Product/E-Commerce Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Store',
              name: 'Makhana E-Store',
              url: 'https://makhanahealthking.com',
              image: 'https://makhanahealthking.com/makhana.png',
              description: 'Online store for premium makhana (fox nuts) and related healthy snacks',
              priceRange: '$$',
            }),
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${manrope.variable} antialiased`}
      >
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <div className="page-content" id="main-content">{children}</div>
      </body>
    </html>
  );
}
