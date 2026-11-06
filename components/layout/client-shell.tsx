import Link from "next/link";
import { Logo } from "@/components/logo";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { clientLogoutAction } from "@/app/client/logout/actions";
import { PII_DISCLAIMER } from "@/lib/constants";
import type { ClientSession } from "@/lib/auth/client-session";

export function ClientShell({
  client,
  children,
}: {
  client: ClientSession;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 md:px-6">
          <Link href="/client">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {client.name}
            </span>
            <NotificationBell />
            <ThemeToggle />
            <form action={clientLogoutAction}>
              <Button type="submit" variant="ghost" size="sm">
                Выйти
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6 md:py-12">
        {children}
      </main>

      <footer className="border-t border-border/70">
        <div className="mx-auto max-w-5xl px-4 py-6 text-xs leading-relaxed text-muted-foreground md:px-6">
          {PII_DISCLAIMER}
        </div>
      </footer>
    </div>
  );
}
