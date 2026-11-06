# Прогресс разработки: Neyroflow

**Текущий статус:** Stage 2 — код готов, ждём проверки инвайта и входа админа  
**Последнее обновление:** 06.11.2026

- [x] Stage 0: каркас Next.js 16, документы, skills, проверки
- [x] Stage 1: БД, RLS, seed, тема, layout, health — **принят**
- [ ] Stage 2: лендинг, логотип, Supabase Auth, клиенты и инвайты — **код готов**
- [ ] Stage 3: админка, канбан, файлы, уведомления, аудит
- [ ] Stage 4: пины, клиентский портал, демо
- [ ] Stage 5: деплой, README, DNS, финальный seed

## Stage 2 — сделано

- [x] Лендинг: CSS-изометрия, glass/neon, фичи, пины, CTA, футер с ПДн.
- [x] `logo.svg`, `logo-dark.svg`, `app/icon.svg`; Manrope + Inter.
- [x] `/login` через Supabase Auth, `proxy.ts` защищает `/admin`.
- [x] `/admin`: shell, дашборд, `/admin/clients`, карточка клиента.
- [x] Создание клиента, выдача/перевыпуск/отзыв инвайта; хеш в БД,
  версия сессии инкрементится.
- [x] `/invite`: обмен токена на HttpOnly-cookie `client_session` (JWT HS256).
- [x] `/client`: список проектов, карточка проекта, изоляция по `client_id`.
- [x] `/demo` — временная заглушка до Stage 4.
- [x] Тёмная/светлая темы проверены на лендинге, console errors нет.
- [x] `npm run verify`, `npm run verify:build` — зелёные.

## Stage 2 — нужен гейт

1. Применить `supabase/seed.dev.sql` (2 тестовых клиента, ссылки:
   `/invite?token=dev-client-a-token` и `...b-token`).
2. Войти на `/login` своим паролем админа; проверить `/admin` и
   `/admin/clients`.
3. Написать «Этап 2 принят» — проверю инвайт A/B и закоммичу гейт.

## Stage 3 — следующий шаг

Канбан с drag-and-drop, CRUD задач, связи, файлы, уведомления, аудит.


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
