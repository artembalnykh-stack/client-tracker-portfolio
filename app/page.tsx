import type { Metadata } from "next";
import { Cta } from "@/components/landing/cta";
import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import { PinShowcase } from "@/components/landing/pin-showcase";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: "Neyroflow — задачи, которые не теряются",
  description:
    "Трекер задач для студии: канбан, пины на макетах, портал клиента и публичное демо.",
};

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main>
        <Hero />
        <Features />
        <PinShowcase />
        <Cta />
      </main>
      <SiteFooter />
    </div>
  );
}
