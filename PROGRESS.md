# Прогресс разработки: Neyroflow

**Текущий статус:** Stage 5: live на Vercel, остался домен  
**Последнее обновление:** 07.11.2026

- [x] Stage 0: каркас Next.js 16, документы, skills, проверки
- [x] Stage 1: БД, RLS, seed, тема, layout, health — **принят**
- [x] Stage 2: лендинг, логотип, Supabase Auth, клиенты и инвайты — **принят**
- [x] Stage 3: админка, канбан, файлы, уведомления, аудит — **принят**
- [x] Stage 4: пины, клиентский портал, демо — **принят**
- [ ] Stage 5: CSS-3D, деплой, README, DNS, финальный seed — **live, домен ждёт**

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

## Stage 3b — файлы, уведомления, аудит

- [x] `/api/attachments`: POST/DELETE, auth админа, origin check, rate limit.
- [x] Валидация: расширение + заявленный MIME + magic bytes + размер;
  JPEG/PNG/WebP/PDF 500 КБ, ZIP/DOCX 2 МБ; SVG/GIF отклоняются.
- [x] Лимит 4 на задачу (сервер + триггер), signed URL 1 час, удаление из Storage.
- [x] UI файлов на задаче: загрузка, предпросмотр изображений, скачивание,
  удаление с подтверждением.
- [x] Уведомление клиенту при загрузке файла.
- [x] `/api/notifications`: GET/PATCH, scoping по admin/client.
- [x] Колокольчик в админке: badge, polling 30 сек, «Прочитать все».
- [x] Аудит: task.create/update/delete/status, relation.create/delete,
  client.create, invite.reissue/revoke, project.create, file.upload/delete.
- [x] `npm run verify`, `npm run verify:build` — зелёные.

## Stage 3 — гейт пройден

- Файл загружается, отображается, скачивается; SVG отклонён.
- 4 файла — лимит, 5-й отклонён; удаление чистит Storage и БД.
- Уведомления клиента по файлам приходят через API (4 unread).
- Аудит пишется; пользователь подтвердил гейт.

## Stage 4 — пины, клиентский портал, демо

- [x] `TaskComments`: проценты `0..100`, маркеры, модалка, Escape, touch.
- [x] Пины на изображениях в админке и клиентском портале; удаление своих.
- [x] Комментарии: общие и пины, файлы до 4, автор/админ-удаление.
- [x] Клиентский портал: доска по 6 статусам, карточка задачи, история.
- [x] Клиентские переходы: «Я ответил», «Принять», «На доработку».
- [x] Клиентские загрузки в задачи и комментарии; уведомление админу.
- [x] Колокольчик у клиента; серверный scoping admin/client.
- [x] Публичное демо `/demo`, `/demo/projects/[id]`, `/demo/tasks/[id]`;
  read-only, локальные картинки, `is_demo = true`.
- [x] `lib/pins.test.ts` (7 тестов), `lib/status.test.ts` (4 теста).
- [x] `npm run verify`, `npm run verify:build` — зелёные.

## Stage 4 — гейт

Проверено через клиента A:
- вход по dev-инвайту, доска проекта, карточка задачи;
- загрузка изображения, пин в точке 50/49.7%, маркер и комментарий;
- общий комментарий с файлом, удаление своих комментария и файла;
- «Я ответил» (`waiting_client → in_progress`) и «На доработку»
  (`on_review → needs_rework`) с историей;
- изоляция: задача клиента B отдаёт 404.

Демо проверено: два проекта, 12 задач, пины и комментарии, read-only.

Пользователю: открыть `/demo` и клиентский портал, проверить на своём экране;
затем «Этап 4 принят».

## Stage 4 — гейт пройден

Пользователь принял Stage 4. Тестовые изменения dev-задач A
(`a…021` → «В работе», `a…022` → «На доработке») остаются в dev-данных;
`cleanup.dev.sql` / финальный seed вернут чистое состояние.

## Stage 5 — CSS-3D и деплой

- [x] CSS-3D hero: неоновая floor-grid, кольца, 3 стеклянные панели,
  2 стеклянных куба, parallax за курсором 240 мс.
- [x] Без WebGL/Three.js и внешних ассетов; панели скрываются на мобильном,
  кубы — с `md`; `prefers-reduced-motion` отключает анимации.
- [x] Демо/лендинг проверены на 1440 и 360, light/dark.
- [x] Скриншоты: `docs/screenshots/hero-3d-desktop-dark.png`,
  `hero-3d-desktop-light.png`, `hero-3d-mobile-light.png`.
- [x] `README.md`: описание, стек, роли, запуск, Mermaid, деплой, ПДн.
- [x] `docs/DEPLOY.md`: Vercel, env, cron, Reg.ru DNS, smoke test.
- [x] `vercel.json`: cron `0 6 * * *` UTC = 09:00 МСК.
- [x] `GET /api/cron/deadlines`: Bearer `CRON_SECRET`, дедлайны на завтра,
  `dedupe_key`, уведомления админу/клиенту; без секрета — 401.
- [x] Финальный seed — `supabase/seed.sql` (6 статусов + 2 демо-проекта,
  12 задач, 3 пина); dev-seed отдельно.
- [x] `npm run verify`, `npm run verify:build` — зелёные.
- [x] GitHub: `https://github.com/artembalnykh-stack/client-tracker-portfolio`,
  ветка `main` запушена.
- [x] Vercel production: `https://client-tracker-portfolio.vercel.app`;
  `/api/health` → 200 (`db/storage/statuses: 6`), `/demo` → 200.
- [x] Вход админа на live проверен пользователем.
- [x] Node runtime: `26.x` (Vercel предупреждал об устаревании 22.x).
- [ ] Поддомен `client-tracker-portfolio.neyrocontent.ru`, DNS Reg.ru,
  `NEXT_PUBLIC_SITE_URL` на поддомен. Apex и `www` не трогаем.

## Stage 5 — гейт

Live-проверка пройдена: health 200, demo 200, вход админа работает.
Остался только домен:

1. Vercel → Domains → `client-tracker-portfolio.neyrocontent.ru`.
2. Reg.ru: CNAME `client-tracker-portfolio` по значению Vercel; `@`/`www`
   не трогаем.
3. Поменять `NEXT_PUBLIC_SITE_URL` на
   `https://client-tracker-portfolio.neyrocontent.ru`, Redeploy.
4. Supabase Auth URL Configuration → домен.
5. Проверить `/api/health`, `/demo`, cron; Stage 5 → 100%.

Cron ищется в Vercel: **Deployments → последний деплой → Deployment
Summary** (раздел Cron Jobs/Schedules) или Project → **Schedules** в новом UI.
Маршрут `/api/cron/deadlines` уже отдаёт 401 без Bearer — значит, live.

## Stage 2 — сделано

- [x] Лендинг: CSS-изометрия, glass/neon, фичи, пины, CTA, футер с ПДн.
- [x] `logo.svg`, `logo-dark.svg`, `app/icon.svg`; Manrope + Inter.
- [x] `/login` через Supabase Auth, `proxy.ts` защищает `/admin`.
- [x] `/admin`: shell, дашборд, `/admin/clients`, карточка клиента.
- [x] Создание клиента, выдача/перевыпуск/отзыв инвайта; хеш в БД,
  версия сессии инкрементится.
- [x] `/invite`: обмен токена на HttpOnly-cookie `client_session` (JWT HS256).
- [x] `/client`: список проектов, доска, карточка задачи, изоляция по `client_id`.
- [x] `/demo` — публичное демо (Stage 4).
- [x] Тёмная/светлая темы проверены на лендинге, console errors нет.
- [x] `npm run verify`, `npm run verify:build` — зелёные.

## Stage 2 — гейт пройден
- Пользователь вошёл админом, проверил `/admin` и `/admin/clients`.
- Dev-инвайты A/B: вход в портал, список своих проектов, выход.
- Изоляция: A не видит проект B и наоборот (прямой URL → 404).
- Найден и исправлен баг: `inviteTokenSchema` требовал 20 символов, а dev-токены
  `dev-client-a-token` / `dev-client-b-token` — 18. Минимум снижен до 16.
- Лендинг проверен в dark/light, console errors нет.

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
- Вложения: `file-type` + `image-size`, bucket `attachments`, signed URL 1 час,
  путь `{task_id|comment_id}/{uuid}.{ext}`. Админ и клиент; клиент удаляет
  только свои файлы.
- Пины: `lib/pins.ts` — проценты от content-box; обёртка изображения равна
  самому изображению, без letterbox. Маркеры absolute, ресайз переживают.
- Комментарии: `TaskComments` общий для админа/клиента/демо; `readOnly` для
  демо. Файлы комментария — до 4.
- Демо: service_role + `is_demo = true`, локальные `/demo-assets/*`; формы
  и серверные действия отключены.
- Клиентские переходы: только `waiting_client → in_progress`,
  `on_review → done|needs_rework`; проверка и в действии, и в RPC.
- Уведомления: файл уведомляет клиента, смена статуса — противоположную сторону;
  админский колокольчик пуст, пока действует только админ. API проверен на клиенте A.
- Аудит best-effort через service role; при сбое основное действие не падает.
- Тестовые file-уведомления клиента A остаются в dev; `cleanup.dev.sql` удалит их
  вместе с dev-клиентами.
