import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-background px-6 text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(34,211,238,0.14),transparent_42%),radial-gradient(circle_at_82%_88%,rgba(139,92,246,0.14),transparent_42%)]" />
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>
      <div className="relative max-w-xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">
          Stage 1
        </p>
        <h1 className="mt-4 font-heading text-5xl font-extrabold tracking-tight">
          Neyroflow
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          База готова: схема, RLS, сиды и тема. Дальше — лендинг и авторизация.
        </p>
      </div>
    </main>
  );
}
