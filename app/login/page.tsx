import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/app/login/login-form";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PII_DISCLAIMER, SITE_TAGLINE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Вход — Neyroflow",
  description: "Вход в админку Neyroflow.",
};

export default function LoginPage() {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-background px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.13),transparent_40%),radial-gradient(circle_at_85%_85%,rgba(139,92,246,0.13),transparent_42%)]" />
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size={40} />
          <p className="mt-3 text-sm text-muted-foreground">{SITE_TAGLINE}</p>
        </div>

        <Card className="border-border/80 bg-card/80 backdrop-blur-xl">
          <CardHeader>
            <h1 className="font-heading text-2xl font-bold">Вход для владельца</h1>
            <p className="text-sm text-muted-foreground">
              Только для администратора студии. Клиенты входят по инвайт-ссылке.
            </p>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            На главную
          </Link>
        </div>

        <p className="mx-auto mt-6 max-w-sm text-center text-[11px] leading-relaxed text-muted-foreground/80">
          {PII_DISCLAIMER}
        </p>
      </div>
    </main>
  );
}
