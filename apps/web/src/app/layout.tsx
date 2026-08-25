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
  title: "InternPrep AI — Placement & Interview Engineering Platform",
  description: "The interview engine calibrated to actual partner rubrics. Practice high-stakes case interviews with voice-activated pushback, real-time MECE rubrics, and line-by-line resume intelligence.",
  openGraph: {
    title: "InternPrep AI — Placement & Interview Engineering Platform",
    description: "Practice high-stakes case interviews with voice-activated pushback, real-time MECE rubrics, and line-by-line resume intelligence.",
    type: "website",
    siteName: "InternPrep AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "InternPrep AI — Placement & Interview Engineering Platform",
    description: "Practice high-stakes case interviews with voice-activated pushback, real-time MECE rubrics, and line-by-line resume intelligence.",
  },
  keywords: ["Interview Prep", "AI Mock Interview", "Case Interview", "Resume Intelligence", "IIT Bombay Placements", "Consulting", "Finance"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable} font-sans antialiased selection:bg-emerald-500/20 selection:text-emerald-400 bg-background text-foreground`}
        suppressHydrationWarning
      >
        <PostHogProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
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
