# Прогресс разработки: Neyroflow

**Текущий статус:** Stage 0 завершён, готов к Stage 1  
**Последнее обновление:** 06.11.2026

- [x] Stage 0: каркас Next.js 16, документы, skills, проверки
- [ ] Stage 1: БД, RLS, seed, тема, layout, health
- [ ] Stage 2: лендинг, логотип, Supabase Auth, клиенты и инвайты
- [ ] Stage 3: админка, канбан, файлы, уведомления, аудит
- [ ] Stage 4: пины, клиентский портал, демо
- [ ] Stage 5: деплой, README, DNS, финальный seed

## Stage 0 — выполнено

- [x] `package.json`, Next 16.4.5, React 19.3, Tailwind 4.3, ESLint 9
- [x] TypeScript 5.9 strict, `tsconfig`, security headers
- [x] `.env.example`, `.gitignore` (`.env*` игнорируются)
- [x] shadcn/ui (`base-nova`), `components/ui/button.tsx`, `lib/utils.ts`
- [x] Manrope + Inter через `next/font`, тёмная тема по умолчанию
- [x] `AGENTS.md`, `docs/TS.md`, `docs/reference.jpg`
- [x] `docs/DECISIONS.md`, `docs/DESIGN.md`
- [x] 3 skill: `supabase-rls-review`, `ui-visual-qa`, `release-security`
- [x] `scripts/check-secrets.mjs`, `scripts/verify-build.sh`
- [x] `npm run verify` и `npm run verify:build` — зелёные
- [x] git init, первый коммит

## Stage 1 — следующий шаг

1. `supabase/migrations/0001_init.sql`: 11 таблиц, индексы, `updated_at`,
   история статусов, циклы связей, лимит вложений, очистка пинов, RLS,
   `is_admin()`, bucket `attachments`, `change_task_status`.
2. `supabase/seed.sql`: статусы + демо; `seed.dev.sql`: 2 dev-клиента с
   известными инвайтами; `cleanup.dev.sql`.
3. `lib/supabase/{server,admin}.ts`, `lib/env.ts`, `/api/health`.
4. Тема dark/light, layout, шрифты, базовые токены.
5. Пользователь применяет SQL, создаёт админа, заполняет `.env.local`,
   запускает `npm run dev`.

## Заметки для следующего агента

- Модель: `deepseek-flash`, `reasoningEffort: high`; песочница `workspace-write`.
- Next.js 16: `proxy.ts` вместо `middleware.ts`, `await cookies()/params`,
  `next lint` удалён — используется `eslint .`.
- TypeScript 5.9.3 (не 7.x) — сознательный выбор ради совместимости
  `eslint-config-next` и типов; обновление отдельной задачей.
- Локальный npm-кэш: `npm_config_cache=.npm-cache`; `.npmrc` не создаётся,
  его блокирует `cc-safety-net`.
- `cc-safety-net` блокирует `.env*` и `.npmrc`; `.env.example` разрешён.
- `verify:build` копирует `node_modules` в temp: Turbopack не резолвит
  `next` через symlink за пределами workspace.
- `shadcn` 4.23 использует стиль `base-nova` и пакет `cn`; не удалять
  `@import "shadcn/tailwind.css"` из `globals.css`.

