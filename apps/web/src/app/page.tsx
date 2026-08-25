import { SmoothScroll } from "@/components/landing/SmoothScroll";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { Hero } from "@/components/landing/hero";
import { CompanyMarquee } from "@/components/landing/company-marquee";
import { MockInterviewSection } from "@/components/landing/mock-interview-section";
import { ResumeIntelligenceSection } from "@/components/landing/resume-intelligence-section";
import { ToolsBentoSection } from "@/components/landing/tools-bento-section";
import { HowItWorks } from "@/components/landing/how-it-works";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { FaqSection } from "@/components/landing/faq-section";
import { FinalCta } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <SmoothScroll>
      <div className="flex flex-col min-h-screen bg-[#08090A] text-white selection:bg-emerald-500/20 selection:text-emerald-300">
        <LandingNavbar />
        <main className="flex-1">
          <Hero />
          <CompanyMarquee />
          <MockInterviewSection />
          <ResumeIntelligenceSection />
          <ToolsBentoSection />
          <HowItWorks />
          <TestimonialsSection />
          <PricingSection />
          <FaqSection />
          <FinalCta />
        </main>
        <Footer />
      </div>
    </SmoothScroll>
  );
}
