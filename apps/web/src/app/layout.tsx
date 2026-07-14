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
  title: "InternPrep AI - IITB Internship Assistant",
  description: "AI-powered resume reviews and case interview mock sessions designed for IIT Bombay students. Master your non-core interviews with precision.",
  openGraph: {
    title: "InternPrep AI - IITB Internship Assistant",
    description: "AI-powered resume reviews and case interview mock sessions designed for IIT Bombay students.",
    type: "website",
  },
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
