import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { PostHogProvider } from "@/components/providers/posthog-provider";

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
  openGraph: {
    title: "InternPrep AI — Day 1 Placement & Case Interview Platform",
    description: "Rigorous case interview simulations and adaptive resume intelligence engineered for Day 1 placements.",
    type: "website",
    siteName: "InternPrep AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "InternPrep AI — Day 1 Placement & Case Interview Platform",
    description: "Rigorous case interview simulations and adaptive resume intelligence engineered for Day 1 placements.",
  },
  keywords: ["Interview Prep", "AI Mock Interview", "Case Interview", "Resume Intelligence", "IIT Bombay Placements", "Consulting Cases"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
          </ThemeProvider>
          <Analytics />
        </PostHogProvider>
      </body>
    </html>
  );
}
