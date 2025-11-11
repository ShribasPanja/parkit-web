import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/sections/Hero";
import { FeaturesSection } from "@/components/sections/Features";
import { HowItWorksSection } from "@/components/sections/HowItWorks";
import { SolutionsSection } from "@/components/sections/Solutions";
import { TestimonialsSection } from "@/components/sections/Testimonials";
import { FAQSection } from "@/components/sections/FAQ";
import { CTASection } from "@/components/sections/CTA";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-screen flex-col bg-slate-50 pt-20 text-slate-900">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <SolutionsSection />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
