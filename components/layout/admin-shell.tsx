import Link from "next/link";
import { LayoutDashboard, Users, Sparkles } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/logout/actions";

export function AdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto flex min-h-dvh max-w-[1600px]">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-border/70 bg-card/40 p-4 lg:flex">
          <Link href="/admin" className="px-2 py-1">
            <Logo />
          </Link>

          <nav className="mt-8 space-y-1 text-sm">
            <Link
              href="/admin"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <LayoutDashboard className="size-4" /> Дашборд
            </Link>
            <Link
              href="/admin/clients"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Users className="size-4" /> Клиенты
            </Link>
            <Link
              href="/demo"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Sparkles className="size-4" /> Демо
            </Link>
          </nav>

          <div className="mt-auto space-y-3 border-t border-border/70 pt-4 text-xs text-muted-foreground">
            <p className="truncate px-2" title={email}>
              {email}
            </p>
            <div className="flex items-center justify-between px-1">
              <ThemeToggle />
              <form action={logoutAction}>
                <Button type="submit" variant="ghost" size="sm">
                  Выйти
                </Button>
              </form>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 items-center justify-between border-b border-border/70 bg-background/80 px-4 backdrop-blur-xl lg:hidden">
            <Link href="/admin">
              <Logo size={24} />
            </Link>
            <div className="flex items-center gap-1">
              <Link
                href="/admin"
                className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                Дашборд
              </Link>
              <Link
                href="/admin/clients"
                className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                Клиенты
              </Link>
              <ThemeToggle />
              <form action={logoutAction}>
                <Button type="submit" variant="ghost" size="sm">
                  Выйти
                </Button>
              </form>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 md:px-8 md:py-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
