"use client";

import {
  useRef,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { Activity, MapPin, Users } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

const columns = [
  {
    title: "Новая",
    color: "#64748b",
    cards: [
      { title: "Подключить аналитику", tag: "low", date: "—", color: "#64748b" },
    ],
  },
  {
    title: "В работе",
    color: "#3b82f6",
    cards: [
      { title: "Сверстать hero", tag: "urgent", date: "сегодня", color: "#ef4444" },
      { title: "Меню и кнопки VK", tag: "normal", date: "+3 д", color: "#3b82f6" },
    ],
  },
  {
    title: "Жду клиента",
    color: "#f59e0b",
    cards: [
      { title: "Тексты для услуг", tag: "high", date: "завтра", color: "#f59e0b" },
    ],
  },
  {
    title: "На проверке",
    color: "#8b5cf6",
    cards: [
      { title: "Форма заявки", tag: "normal", date: "+4 д", color: "#3b82f6" },
    ],
  },
  {
    title: "На доработке",
    color: "#ef4444",
    cards: [
      { title: "Мобильная версия", tag: "high", date: "вчера", color: "#f59e0b" },
    ],
  },
  {
    title: "Принято",
    color: "#22c55e",
    cards: [
      { title: "Мудборд", tag: "done", date: "готово", color: "#22c55e" },
    ],
  },
];

const pins = [
  { left: "19%", top: "31%", color: "#22d3ee", delay: 0 },
  { left: "63%", top: "47%", color: "#8b5cf6", delay: 0.8 },
  { left: "78%", top: "24%", color: "#f472b6", delay: 1.4 },
];

const cubeFaces = [
  "front",
  "back",
  "right",
  "left",
  "top",
  "bottom",
] as const;

function GlassCube({ size, z }: { size: number; z: number }) {
  return (
    <div
      className="nf-cube-scene"
      style={{ width: size, height: size } as CSSProperties}
    >
      <div
        className="nf-cube"
        style={{ "--cube-z": `${z}px` } as CSSProperties}
      >
        {cubeFaces.map((face) => (
          <div key={face} className={`nf-cube__face nf-cube__face--${face}`} />
        ))}
      </div>
    </div>
  );
}

export function HeroBoard() {
  const reduce = useReducedMotion();
  const sceneRef = useRef<HTMLDivElement>(null);

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (reduce || event.pointerType === "touch") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(
      -0.5,
      Math.min(0.5, (event.clientX - rect.left) / rect.width - 0.5),
    );
    const y = Math.max(
      -0.5,
      Math.min(0.5, (event.clientY - rect.top) / rect.height - 0.5),
    );
    sceneRef.current?.style.setProperty("--px", `${x * 24}px`);
    sceneRef.current?.style.setProperty("--py", `${y * 24}px`);
  }

  function resetParallax() {
    sceneRef.current?.style.setProperty("--px", "0px");
    sceneRef.current?.style.setProperty("--py", "0px");
  }

  return (
    <div
      ref={sceneRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetParallax}
      className="nf-scene relative mx-auto w-full max-w-2xl"
      aria-hidden="true"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="nf-floor absolute inset-x-[-30%] -bottom-24 h-[58%] opacity-40" />
        <div className="nf-floor-glow absolute inset-x-0 -bottom-8 h-44 opacity-70" />
        <div className="nf-ring absolute left-1/2 top-1/2 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full" />
        <div className="nf-ring nf-ring--violet absolute left-1/2 top-1/2 size-[390px] -translate-x-1/2 -translate-y-1/2 rounded-full" />
      </div>

      <div className="pointer-events-none absolute -inset-12 rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.18),transparent_60%)] blur-3xl" />

      <div className="nf-parallax-board relative z-10">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 p-4 shadow-[0_40px_120px_-45px_rgba(34,211,238,0.55)] backdrop-blur-xl [perspective:1400px]">
        <motion.div
          animate={reduce ? undefined : { y: [0, -10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="mx-auto w-full max-w-[680px]"
        >
          <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/85 p-4 shadow-2xl [transform:rotateX(52deg)_rotateZ(-32deg)] [transform-style:preserve-3d]">
            <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-cyan-300/80">
              <span>Neyroflow board</span>
              <span className="inline-flex items-center gap-1 text-emerald-300/80">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                live
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
              {columns.map((column) => (
                <div key={column.title} className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[9px] text-slate-400">
                    <span
                      className="size-1.5 rounded-full"
                      style={{ backgroundColor: column.color }}
                    />
                    {column.title}
                  </div>

                  {column.cards.map((card) => (
                    <div
                      key={card.title}
                      className="rounded-lg border border-white/10 bg-white/[0.04] p-2 shadow-sm"
                    >
                      <div
                        className="mb-1 h-1 w-6 rounded-full"
                        style={{ backgroundColor: card.color }}
                      />
                      <p className="text-[9px] leading-tight text-slate-200">
                        {card.title}
                      </p>
                      <div className="mt-1 flex items-center justify-between text-[8px] text-slate-500">
                        <span>{card.tag}</span>
                        <span>{card.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {pins.map((pin) => (
          <motion.div
            key={`${pin.left}-${pin.top}`}
            className="absolute z-30 size-3 rounded-full border-2 border-slate-950"
            style={{
              left: pin.left,
              top: pin.top,
              backgroundColor: pin.color,
              boxShadow: `0 0 18px ${pin.color}`,
            }}
            animate={
              reduce
                ? undefined
                : { scale: [1, 1.35, 1], opacity: [0.8, 1, 0.8] }
            }
            transition={{
              duration: 3.5,
              repeat: Infinity,
              delay: pin.delay,
              ease: "easeInOut",
            }}
          />
        ))}
        </div>
      </div>

      <div className="nf-parallax-1 pointer-events-none absolute -left-8 top-12 z-20 hidden w-40 sm:block">
        <div className="nf-float" style={{ animationDelay: "0.4s" }}>
          <div className="rounded-2xl border border-white/15 bg-slate-950/70 p-3 shadow-[0_18px_60px_-20px_rgba(34,211,238,0.45)] backdrop-blur-xl [transform:rotateY(10deg)_rotateX(4deg)]">
            <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.22em] text-cyan-300/80">
              <Users className="size-3" /> Client portal
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-100">
              3 проекта
            </p>
            <div className="mt-2 flex gap-1">
              {["#22d3ee", "#8b5cf6", "#f472b6"].map((color) => (
                <span
                  key={color}
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <p className="mt-1.5 text-[10px] text-slate-400">
              2 клиента онлайн
            </p>
          </div>
        </div>
      </div>

      <div className="nf-parallax-2 pointer-events-none absolute -right-8 top-1/3 z-20 hidden w-40 md:block">
        <div
          className="nf-float nf-float--slow"
          style={{ animationDelay: "-1.2s" }}
        >
          <div className="rounded-2xl border border-white/15 bg-slate-950/70 p-3 shadow-[0_18px_60px_-20px_rgba(139,92,246,0.45)] backdrop-blur-xl [transform:rotateY(-12deg)_rotateX(2deg)]">
            <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.22em] text-violet-300/80">
              <MapPin className="size-3" /> Pins
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-100">
              12 правок
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400">
              <span className="size-1.5 rounded-full bg-cyan-300" />
              прямо на макетах
            </div>
          </div>
        </div>
      </div>

      <div className="nf-parallax-1 pointer-events-none absolute -left-4 -bottom-8 z-20 hidden w-36 lg:block">
        <div className="nf-float nf-float--slow">
          <div className="rounded-2xl border border-white/15 bg-slate-950/70 p-3 shadow-[0_18px_60px_-20px_rgba(34,211,238,0.35)] backdrop-blur-xl [transform:rotateY(8deg)_rotateX(-3deg)]">
            <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.22em] text-emerald-300/80">
              <Activity className="size-3" /> Live board
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-100">
              6 колонок
            </p>
            <p className="mt-1.5 text-[10px] text-slate-400">
              синхронизация включена
            </p>
          </div>
        </div>
      </div>

      <div className="nf-parallax-2 pointer-events-none absolute -right-3 -top-12 z-20 hidden md:block">
        <div
          className="nf-float nf-float--slow"
          style={{ animationDelay: "-2.2s" }}
        >
          <GlassCube size={34} z={17} />
        </div>
      </div>

      <div className="nf-parallax-1 pointer-events-none absolute -left-10 bottom-28 z-0 hidden lg:block">
        <div className="nf-float">
          <GlassCube size={22} z={11} />
        </div>
      </div>
    </div>
  );
}
