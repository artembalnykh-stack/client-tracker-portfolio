# Прогресс разработки: Neyroflow

**Текущий статус:** Stage 1 принят, готов к Stage 2  
**Последнее обновление:** 06.11.2026

- [x] Stage 0: каркас Next.js 16, документы, skills, проверки
- [x] Stage 1: БД, RLS, seed, тема, layout, health — **принят**
- [ ] Stage 2: лендинг, логотип, Supabase Auth, клиенты и инвайты
- [ ] Stage 3: админка, канбан, файлы, уведомления, аудит
- [ ] Stage 4: пины, клиентский портал, демо
- [ ] Stage 5: деплой, README, DNS, финальный seed

## Stage 1 — сделано

- [x] `supabase/migrations/0001_init.sql`: 11 таблиц, индексы, `updated_at`,
  история статусов, циклы связей, лимит вложений, очистка пинов, RLS,
  `is_admin()`, bucket `attachments`, `change_task_status`.
- [x] `supabase/seed.sql`: 6 статусов, демо-клиент, 2 проекта, 12 задач,
  3 вложения, 5 комментариев (3 с пинами), история.
- [x] `supabase/seed.dev.sql`: 2 dev-клиента с известными инвайтами;
  `cleanup.dev.sql`, `reset.sql`.
- [x] SQL проверен в PGlite: миграция, seed дважды, dev seed дважды,
  переходы статусов, запрет недопустимого перехода, пин не к той задаче,
  цикл связей, лимит 4 вложений, cleanup, reset + повторное применение.
- [x] `lib/supabase/{admin,server,browser}.ts`, `lib/env.server.ts`.
- [x] `/api/health`: проверяет `statuses = 6` и bucket `attachments`.
- [x] `lib/status.ts`, `lib/priority.ts`.
- [x] Тема dark/light на брендовых токенах, `ThemeProvider`, `ThemeToggle`,
  Manrope + Inter, фоновые свечения.
- [x] `docs/SCHEMA.md`, `docs/SUPABASE-SETUP.md`.
- [x] `npm run verify`, `npm run verify:build` — зелёные.

## Stage 1 — гейт пройден

- `statuses: 6`, `buckets: 1`, `profiles: 1` в Supabase SQL Editor.
- `/api/health` → `ok:true, db:true, storage:true, statuses:6`.
- Тёмная и светлая темы проверены через dsh-pilot: переключение работает,
  console errors нет.
- Причина первого `PGRST125`: в `NEXT_PUBLIC_SUPABASE_URL` был `/rest/v1/`;
  исправлено на Project URL. Задокументировано в `docs/SUPABASE-SETUP.md`.

## Stage 2 — следующий шаг

Лендинг с CSS-изометрией, логотипы, `/login`, защита `/admin` через `proxy.ts`,
клиенты/инвайты, `/invite`, тема.

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
- Демо-картинки: `public/demo-assets/*.jpg`, размеры в seed совпадают с файлами.
- `NEXT_PUBLIC_SUPABASE_URL` — только Project URL (`https://<ref>.supabase.co`),
  без `/rest/v1`; иначе PostgREST отдаёт `PGRST125`. Health в dev показывает
  `urlPath`, `keyFormat`, `projectRef` — в production этих полей нет.
