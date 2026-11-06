# Прогресс разработки: Neyroflow

**Текущий статус:** Stage 3a готов, следующий шаг — Stage 3b  
**Последнее обновление:** 06.11.2026

- [x] Stage 0: каркас Next.js 16, документы, skills, проверки
- [x] Stage 1: БД, RLS, seed, тема, layout, health — **принят**
- [x] Stage 2: лендинг, логотип, Supabase Auth, клиенты и инвайты — **принят**
- [ ] Stage 3: админка, канбан, файлы, уведомления, аудит — **3a готов**
- [ ] Stage 4: пины, клиентский портал, демо
- [ ] Stage 5: деплой, README, DNS, финальный seed

## Stage 3a — доска и задачи

- [x] `/admin`: 6 колонок, dnd-kit, оптимистичный перенос, откат при ошибке.
- [x] Клавиатурный drag: Space → стрелки → Space.
- [x] Фильтры (проект, клиент, приоритет, статус), поиск, «Доска / Список»,
  сортировка списка.
- [x] Создание, редактирование, удаление задачи; дедлайн, приоритет.
- [x] Смена статуса через `change_task_status`, история и уведомление.
- [x] Связи parent/child, добавление/удаление, запрет циклов.
- [x] Создание проектов у клиента.
- [x] Исправлена hydration-ошибка dnd-kit: стабильный `DndContext id`.
- [x] Удаление через встроенное подтверждение вместо `window.confirm`.
- [x] `npm run verify`, `npm run verify:build` — зелёные.

## Stage 3b — следующий шаг

- `/api/attachments`: загрузка/удаление, magic bytes, лимиты 4, signed URL.
- Колокольчик, polling 30 сек, «прочитать все».
- Аудит действий.
- Файлы на странице задачи; комментарии — Stage 4.

## Stage 3 — гейт после 3b

Проверить загрузку файлов, лимиты, уведомления и аудит; затем «Этап 3 принят».

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

## Stage 2 — гейт пройден
- Пользователь вошёл админом, проверил `/admin` и `/admin/clients`.
- Dev-инвайты A/B: вход в портал, список своих проектов, выход.
- Изоляция: A не видит проект B и наоборот (прямой URL → 404).
- Найден и исправлен баг: `inviteTokenSchema` требовал 20 символов, а dev-токены
  `dev-client-a-token` / `dev-client-b-token` — 18. Минимум снижен до 16.
- Лендинг проверен в dark/light, console errors нет.

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
- Инвайт-токен: `inviteTokenSchema` минимум 16 символов; dev-токены длиной 18.
  Не поднимать минимум выше 16, иначе `seed.dev.sql` перестанет работать.
- DnD: у `DndContext` обязателен стабильный `id="admin-board"`, иначе SSR/CSR
  генерируют разные `aria-describedby` и React ругается на hydration.
- Удаление задачи — встроенное подтверждение, не `window.confirm`
  (dsh-pilot не умеет принимать нативные диалоги).
