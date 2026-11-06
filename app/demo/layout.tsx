import type { Metadata } from "next";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: "Демо — Neyroflow",
  description:
    "Публичное демо трекера Neyroflow: вымышленные проекты, задачи и пины на макетах.",
};

export default function DemoLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <div className="border-b border-primary/20 bg-primary/5">
        <p className="mx-auto max-w-6xl px-4 py-2 text-center text-xs text-muted-foreground md:px-6">
          Демо-режим: только чтение. Все имена, компании и задачи вымышлены.
        </p>
      </div>
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
