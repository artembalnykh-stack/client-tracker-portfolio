import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { HeroBoard } from "@/components/landing/hero-board";
import { buttonVariants } from "@/components/ui/button";
import { SITE_TAGLINE } from "@/lib/constants";

const stats = [
  { value: "6", label: "статусов задач" },
  { value: "4", label: "файла на задачу" },
  { value: "30", label: "дней живёт инвайт" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_-10%,rgba(34,211,238,0.16),transparent_42%),radial-gradient(circle_at_88%_10%,rgba(139,92,246,0.16),transparent_45%)]" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:px-6 md:py-24 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="size-3.5 text-primary" />
            Трекер для студии и клиента
          </div>

          <h1 className="mt-6 max-w-xl font-heading text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Задачи, которые
            <span className="bg-gradient-to-r from-cyan-600 via-violet-600 to-pink-600 bg-clip-text text-transparent dark:from-cyan-300 dark:via-violet-400 dark:to-pink-400">
              {" "}
              не теряются
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
            Канбан, пины прямо на макетах и прозрачный портал для клиента — без
            переписок в мессенджерах и потерянных правок.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/demo"
              className={buttonVariants({ size: "lg", className: "gap-2" })}
            >
              Открыть демо <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/login"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Войти
            </Link>
          </div>

          <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-border/70 pt-6">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd className="font-heading text-2xl font-bold">{stat.value}</dd>
                <dd className="mt-1 text-xs text-muted-foreground">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-6 text-xs text-muted-foreground/70">
            {SITE_TAGLINE}
          </p>
        </div>

        <HeroBoard />
      </div>
    </section>
  );
}
