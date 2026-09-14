import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { PostHogProvider } from "@/components/providers/posthog-provider";
import { Toaster } from "@/components/ui/sonner";
import { CookieConsentBanner } from "@/components/privacy/CookieConsentBanner";

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
});

const fontDisplay = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://internprep.ai"),
  title: "InternPrep AI — Day 1 Placement & Case Interview Platform",
  description: "Rigorous case interview simulations and adaptive resume intelligence engineered for Day 1 placements at IIT Bombay and premier campuses.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "InternPrep AI — Day 1 Placement & Case Interview Platform",
    description: "Rigorous case interview simulations and adaptive resume intelligence engineered for Day 1 placements.",
    type: "website",
    siteName: "InternPrep AI",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "InternPrep AI — Day 1 Placement & Case Interview Platform",
    description: "Rigorous case interview simulations and adaptive resume intelligence engineered for Day 1 placements.",
  },
  keywords: [
    "Interview Prep", 
    "AI Mock Interview", 
    "Case Interview", 
    "Resume Intelligence", 
    "IIT Bombay Placements", 
    "Consulting Cases",
    "DPDP Act 2023 Compliant"
  ],
};

const jsonLdData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://internprep.ai/#organization",
      "name": "InternPrep AI",
      "founder": {
        "@type": "Person",
        "name": "Krishna Gahlod"
      },
      "url": "https://internprep.ai",
      "logo": "https://internprep.ai/icon.svg",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Mumbai",
        "addressRegion": "Maharashtra",
        "addressCountry": "IN"
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "email": "krishnagahlod@gmail.com",
        "contactType": "customer support",
        "availableLanguage": ["English", "Hindi"]
      }
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://internprep.ai/#software",
      "name": "InternPrep AI",
      "applicationCategory": "EducationalApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "INR"
      },
      "description": "Rigorous case interview simulations and adaptive resume intelligence engineered for Day 1 placements at IIT Bombay and premier campuses."
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      </head>
      <body
        className={`${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable} font-sans antialiased selection:bg-emerald-500/20 selection:text-emerald-600 dark:selection:text-emerald-300 bg-background text-foreground transition-colors duration-150`}
        suppressHydrationWarning
      >
        <PostHogProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster position="top-right" richColors closeButton />
            <CookieConsentBanner />
          </ThemeProvider>
          <Analytics />
        </PostHogProvider>
      </body>
    </html>
  );
}
