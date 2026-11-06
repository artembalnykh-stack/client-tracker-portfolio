import type { Metadata } from "next";
import Link from "next/link";
import { acceptInviteAction } from "@/app/invite/actions";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PII_DISCLAIMER } from "@/lib/constants";
import { getInviteStatus, hashInviteToken } from "@/lib/invites";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Вход в портал — Neyroflow",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  invalid: "Ссылка недействительна или истекла. Попросите новую у студии.",
  rate: "Слишком много попыток. Попробуйте через минуту.",
  config: "Портал временно недоступен. Попробуйте позже.",
};

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[]; error?: string | string[] }>;
}) {
  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const errorCode = Array.isArray(params.error)
    ? params.error[0]
    : params.error;

  let clientName: string | null = null;

  if (token) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("clients")
      .select(
        "name, invite_expires_at, invite_revoked_at, is_demo, invite_token_hash",
      )
      .eq("invite_token_hash", hashInviteToken(token))
      .maybeSingle();

    const valid =
      data &&
      !data.is_demo &&
      getInviteStatus(
        data.invite_token_hash,
        data.invite_expires_at,
        data.invite_revoked_at,
      ) === "active";

    if (valid && data) clientName = data.name;
  }

  const error = errorCode
    ? (errorMessages[errorCode] ?? errorMessages.invalid)
    : !token
      ? "Откройте ссылку, которую прислала студия."
      : !clientName
        ? errorMessages.invalid
        : null;

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-background px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.13),transparent_40%),radial-gradient(circle_at_85%_85%,rgba(139,92,246,0.13),transparent_42%)]" />
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size={40} />
          <p className="mt-3 text-sm text-muted-foreground">
            Портал клиента
          </p>
        </div>

        <Card className="border-border/80 bg-card/80 backdrop-blur-xl">
          <CardHeader>
            <h1 className="font-heading text-2xl font-bold">
              {clientName ? `Здравствуйте, ${clientName}` : "Вход в портал"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {clientName
                ? "Нажмите кнопку — и мы откроем ваши проекты. Пароль не нужен."
                : "Доступ выдаёт студия по персональной ссылке."}
            </p>
          </CardHeader>

          <CardContent className="space-y-5">
            {error ? (
              <p
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </p>
            ) : null}

            {clientName && token ? (
              <form action={acceptInviteAction}>
                <input type="hidden" name="token" value={token} />
                <Button type="submit" className="w-full">
                  Войти в портал
                </Button>
              </form>
            ) : (
              <Link
                href="/"
                className={buttonVariants({ variant: "outline", className: "w-full" })}
              >
                На главную
              </Link>
            )}

            <p className="text-xs leading-relaxed text-muted-foreground">
              Ссылка действует 30 дней. Если она истекла, студия выпустит новую.
            </p>
          </CardContent>
        </Card>

        <p className="mx-auto mt-6 max-w-sm text-center text-[11px] leading-relaxed text-muted-foreground/80">
          {PII_DISCLAIMER}
        </p>
      </div>
    </main>
  );
}
