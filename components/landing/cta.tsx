import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function Cta() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 md:px-6 md:pb-24">
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/60 px-6 py-12 text-center shadow-2xl backdrop-blur-xl md:px-12 md:py-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.18),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.18),transparent_45%)]" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            Демо
          </p>
          <h2 className="mx-auto mt-3 max-w-2xl font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
            Посмотрите доску глазами клиента
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Публичное демо без регистрации: два проекта, двенадцать задач и
            комментарии с пинами. Никаких реальных данных.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
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
              Вход для владельца
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
