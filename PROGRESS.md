# Прогресс разработки: Neyroflow

**Текущий статус:** Stage 4 готов, ждём гейта  
**Последнее обновление:** 06.11.2026

- [x] Stage 0: каркас Next.js 16, документы, skills, проверки
- [x] Stage 1: БД, RLS, seed, тема, layout, health — **принят**
- [x] Stage 2: лендинг, логотип, Supabase Auth, клиенты и инвайты — **принят**
- [x] Stage 3: админка, канбан, файлы, уведомления, аудит — **принят**
- [ ] Stage 4: пины, клиентский портал, демо — **готов к гейту**
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
