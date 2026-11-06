import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Демо — Neyroflow",
  description: "Публичное демо трекера Neyroflow.",
};

export default function DemoPage() {
  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main className="mx-auto grid min-h-[60dvh] max-w-3xl place-items-center px-4 py-16">
        <Card className="w-full border-border/70 bg-card/70 backdrop-blur-xl">
          <CardHeader>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              Демо-режим
            </p>
            <h1 className="mt-2 font-heading text-3xl font-extrabold">
              Демо готовится
            </h1>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-muted-foreground">
              Публичная доска с двумя проектами и пинами появится на Stage 4.
              Пока можно посмотреть лендинг и войти в админку.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/" className={buttonVariants({ variant: "outline" })}>
                На главную
              </Link>
              <Link href="/login" className={buttonVariants()}>
                Войти
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
