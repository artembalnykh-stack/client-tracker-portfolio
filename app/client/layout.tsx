import type { Metadata } from "next";
import Link from "next/link";
import { ClientShell } from "@/components/layout/client-shell";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getClientSession } from "@/lib/auth/client-session";
import { PII_DISCLAIMER } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Портал клиента — Neyroflow",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ClientLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const client = await getClientSession();

  if (!client) {
    return (
      <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-background px-4 py-12">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center">
            <Logo size={40} />
          </div>
          <Card className="border-border/80 bg-card/80 backdrop-blur-xl">
            <CardHeader>
              <h1 className="font-heading text-2xl font-bold">
                Нужна новая ссылка
              </h1>
              <p className="text-sm text-muted-foreground">
                Сессия не найдена или истекла. Попросите у студии новую
                инвайт-ссылку — пароль не нужен.
              </p>
            </CardHeader>
            <CardContent>
              <Link
                href="/"
                className={buttonVariants({ variant: "outline", className: "w-full" })}
              >
                На главную
              </Link>
            </CardContent>
          </Card>
          <p className="mx-auto mt-6 max-w-sm text-center text-[11px] leading-relaxed text-muted-foreground/80">
            {PII_DISCLAIMER}
          </p>
        </div>
      </main>
    );
  }

  return <ClientShell client={client}>{children}</ClientShell>;
}
