# Прогресс разработки: Neyroflow

**Текущий статус:** Stage 0 — каркас  
**Последнее обновление:** 06.11.2026

- [ ] Stage 0: каркас Next.js 16, документы, skills, проверки
- [ ] Stage 1: БД, RLS, seed, тема, layout, health
- [ ] Stage 2: лендинг, логотип, Supabase Auth, клиенты и инвайты
- [ ] Stage 3: админка, канбан, файлы, уведомления, аудит
- [ ] Stage 4: пины, клиентский портал, демо
- [ ] Stage 5: деплой, README, DNS, финальный seed

## Stage 0

- [x] `package.json`, Next 16, Tailwind 4, ESLint, TypeScript strict
- [x] Security headers, `.env.example`, `.gitignore`
- [x] `AGENTS.md`, `docs/TS.md`, `docs/reference.jpg`
- [ ] `npm install` + shadcn/ui
- [ ] `docs/DECISIONS.md`, `docs/DESIGN.md`
- [ ] 3 проектных skill
- [ ] `scripts/check-secrets.mjs`, `scripts/verify-build.sh`
- [ ] `npm run verify`, `npm run verify:build`
- [ ] git init + первый коммит

## Заметки для следующего агента

- Модель: `deepseek-flash`, `reasoningEffort: high`; песочница `workspace-write`.
- Next.js 16.4.5: `proxy.ts` вместо `middleware.ts`, `await cookies()/params`,
  `next lint` удалён — используется `eslint .`.
- TypeScript 5.9.3 (не 7.x) — сознательный выбор ради совместимости
  `eslint-config-next` и типов; обновление отдельной задачей.
- Локальный npm-кэш: `npm_config_cache=.npm-cache` (`.npmrc` заблокирован
  guard-ом и не создаётся).
- `cc-safety-net` блокирует `.env*` и `.npmrc`; `.env.example` разрешён.
- Следующий шаг: Stage 1 — `supabase/migrations/0001_init.sql`, seed, тема,
  `/api/health`.
