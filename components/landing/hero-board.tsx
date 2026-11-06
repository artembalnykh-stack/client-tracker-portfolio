"use client";

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

export function HeroBoard() {
  const reduce = useReducedMotion();

  return (
    <div className="relative mx-auto w-full max-w-2xl" aria-hidden="true">
      <div className="pointer-events-none absolute -inset-12 rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.18),transparent_60%)] blur-3xl" />

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
            className="absolute size-3 rounded-full border-2 border-slate-950"
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
  );
}
