import Image from "next/image";
import { MapPin } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const pins = [
  { left: "42.5%", top: "31.2%", color: "#22d3ee", n: 1 },
  { left: "70%", top: "58%", color: "#8b5cf6", n: 2 },
  { left: "24%", top: "72%", color: "#f472b6", n: 3 },
];

export function PinShowcase() {
  return (
    <section id="pins" className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
      <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <div className="relative">
          <div className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-[radial-gradient(circle_at_40%_30%,rgba(139,92,246,0.18),transparent_60%)] blur-2xl" />
          <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/60 p-2 shadow-2xl">
            <div className="relative overflow-hidden rounded-xl">
              <Image
                src="/demo-assets/landing-hero.jpg"
                alt="Макет лендинга с комментариями клиента"
                width={1200}
                height={800}
                className="h-auto w-full object-cover"
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
              {pins.map((pin) => (
                <div
                  key={pin.n}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: pin.left, top: pin.top }}
                >
                  <span
                    className="absolute inset-0 -m-3 animate-ping rounded-full opacity-30"
                    style={{ backgroundColor: pin.color }}
                  />
                  <span
                    className="relative grid size-9 place-items-center rounded-full border-2 border-slate-950 text-xs font-bold text-slate-950 shadow-lg"
                    style={{ backgroundColor: pin.color }}
                  >
                    {pin.n}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            Киллер-фича
          </p>
          <h2 className="mt-3 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
            Правка привязана к месту
          </h2>
          <p className="mt-4 text-muted-foreground">
            Клиент кликает по макету — и оставляет комментарий прямо в точке.
            Координаты в процентах, поэтому пины не съезжают при ресайзе, смене
            темы и на телефоне.
          </p>

          <div className="mt-6 space-y-3">
            <Card className="border-border/70 bg-card/70">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span className="grid size-7 place-items-center rounded-full bg-cyan-400 text-xs font-bold text-slate-950">
                    1
                  </span>
                  Демо-клиент
                  <span className="ml-auto text-xs font-normal text-muted-foreground">
                    10:31
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Заголовок слишком крупный: на ноутбуке занимает весь первый
                  экран. Уменьшите на 20–25%.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/70">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span className="grid size-7 place-items-center rounded-full bg-violet-400 text-xs font-bold text-slate-950">
                    2
                  </span>
                  Демо-клиент
                  <span className="ml-auto text-xs font-normal text-muted-foreground">
                    10:34
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  А здесь увеличьте отступ и добавьте второй CTA — «Смотреть
                  кейсы».
                </p>
              </CardContent>
            </Card>
          </div>

          <p className="mt-5 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4 text-primary" />
            Пины работают у админа и клиента; на мобильном — тап.
          </p>
        </div>
      </div>
    </section>
  );
}
