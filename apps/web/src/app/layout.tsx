import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { PostHogProvider } from "@/components/providers/posthog-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "InternPrep AI | Master the Interview. Built for Day 1.",
  description: "A battle-tested AI copilot for Consulting Cases, Tech System Design, Finance, and Product. Voice-enabled practice, digital whiteboard integration, and recruiter-grade resume intelligence.",
  openGraph: {
    title: "InternPrep AI | Master the Interview",
    description: "Voice-enabled mock interviews and AI resume intelligence engineered for Day 1 placements.",
    type: "website",
    siteName: "InternPrep AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "InternPrep AI | Master the Interview",
    description: "Voice-enabled mock interviews and AI resume intelligence engineered for Day 1 placements.",
  },
  keywords: ["Interview Prep", "AI Mock Interview", "Resume Builder", "Consulting Cases", "Tech Interviews"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${outfit.variable} font-sans antialiased selection:bg-primary/20 selection:text-primary bg-background text-foreground`}
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
