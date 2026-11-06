import Link from "next/link";
import { ArrowUpRight, Code2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { PII_DISCLAIMER, SITE_TAGLINE } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-background/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 md:flex-row md:items-start md:justify-between md:px-6">
        <div className="max-w-md space-y-3">
          <Logo />
          <p className="text-sm text-muted-foreground">{SITE_TAGLINE}</p>
          <p className="text-xs leading-relaxed text-muted-foreground/80">
            {PII_DISCLAIMER}
          </p>
        </div>

        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <Link href="/demo" className="hover:text-foreground">
            Демо
          </Link>
          <Link href="/login" className="hover:text-foreground">
            Вход для владельца
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground"
          >
            GitHub <ArrowUpRight className="size-3" />
          </a>
        </div>
      </div>

      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:px-6">
          <span>© 2026 Neyroflow</span>
          <span className="inline-flex items-center gap-1">
            <Code2 className="size-3" /> Portfolio MVP
          </span>
        </div>
      </div>
    </footer>
  );
}
