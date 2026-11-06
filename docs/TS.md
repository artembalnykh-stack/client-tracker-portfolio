# ТЕХНИЧЕСКОЕ ЗАДАНИЕ ДЛЯ AI-АГЕНТА: Трекер задач (Portfolio MVP)

**Версия:** 2.0 (финализировано после уточнений)
**Дата:** 06.11.2026
**Статус:** готово к разработке

---

## 0. Что изменилось в v2

Зафиксированы решения, снимающие неоднозначности первой версии:

1. **Supabase-проект уже создан.** Пользователь сам применяет SQL в SQL Editor. Агент не запрашивает и не получает `service_role`, пароли и другие секреты. Пользователь сам заполняет `.env.local`.
2. **У клиента может быть несколько проектов.** Инвайт-ссылка выдаётся клиенту, а не проекту. В портале клиент видит все свои проекты.
3. **«Этапы» — это только этапы разработки этого трекера (1–5).** Сущность трекера — **справочник статусов задач** (`statuses`), а не «этапы проекта». Таблица `stages` из v1 переименована в `statuses`.
4. **Клиент не создаёт задачи.** Может менять только те статусы, где это логично: ответил клиенту, принял работу, отправил на доработку.
5. **Вложения:** максимум 4 файла на задачу и 4 файла на комментарий. Список типов не расширяем.
6. **Уведомления:** только in-app (колокольчик). Email/Telegram — вне MVP.
7. **Деплой:** Vercel вместо Railway. Домен `neyrocontent.ru` (apex, без `www`). Если apex не получится — fallback на `neyrocontent.vercel.app`.
8. **Публичное демо:** `/demo` с seed-данными, без регистрации.
9. **Визуал:** CSS-изометрия + glass/neon, без WebGL. Светлая и тёмная темы.
10. **Канбан:** обязателен для админа; клиент видит доску в режиме чтения + кнопки согласования.

---

## 1. Входные данные

Перед началом работы агент обязан изучить:

- **`reference.jpg`** — визуальный референс: тёмный неоновый glassmorphism, изометрическая 3D-доска, стеклянные панели, свечения, «дорогая» техно-эстетика.
- **`TS.md`** — данный файл.

Референс задаёт настроение и палитру, но не копируется буквально: это мокап AI-оркестратора, а не трекера. Нужно перенести стиль на реальные экраны трекера.

---

## 2. Роль и цель

Ты — Senior Fullstack Developer. Цель: за 2 спринта собрать рабочий визуально эффектный прототип трекера задач для портфолио.

**Главное правило:** участие пользователя минимально. Агент делает всё сам, кроме действий, требующих его аккаунтов и секретов. Для таких действий агент выдаёт пошаговую инструкцию «куда нажать».

---

## 3. Жёсткие правила работы

1. **Режим чекпоинтов.** После каждого этапа — остановка, краткий отчёт и запрос подтверждения по чек-листу. Без команды «Продолжай» следующий этап не начинать.
2. **Безопасность данных.** Никогда не запрашивать и не выводить пароли, API-ключи, токены, `service_role` и содержимое `.env.local`. Пользователь создаёт `.env.local` сам. В репозиторий попадает только `.env.example` с названиями переменных.
3. **Секреты только на сервере.** `SUPABASE_SERVICE_ROLE_KEY`, `CLIENT_SESSION_SECRET`, `CRON_SECRET` используются только в server-only модулях. Запрещено импортировать их в клиентские компоненты и логировать.
4. **Файл прогресса.** В корне всегда поддерживать актуальный `PROGRESS.md` после каждого шага.
5. **Дисклеймер ПДн.** В README и футере приложения (включая `/demo`) разместить дословно:

> Внимание: система использует зарубежные сервисы хранения данных. Запрещено загружать реальные персональные данные (ПДн). Используйте только маскированные или тестовые данные.

6. **Визуальный стиль.** Все решения по цветам, типографике, 3D-элементам, логотипу и настроению — на основе `reference.jpg`. Если референс мешает UX — адаптировать, сохраняя дух.
7. **Никаких реальных ПДн в seed-данных.** Только вымышленные имена, компании, email и телефоны.
8. **Проверка перед сдачей этапа:** `npm run lint`, `npm run typecheck`, `npm run build` должны проходить без ошибок.

---

## 4. Стек технологий

| Слой | Технологии |
|---|---|
| Frontend/Backend | Next.js (App Router, latest stable), TypeScript strict, Tailwind CSS, shadcn/ui |
| Анимации | Framer Motion |
| Канбан | `@dnd-kit/core` + `@dnd-kit/sortable` |
| Формы/валидация | `react-hook-form` + `zod` |
| Иконки | `lucide-react` |
| Даты | `date-fns` (локаль `ru`) |
| Файлы | `file-type` для проверки magic bytes |
| БД и Storage | Supabase (PostgreSQL + Storage) |
| Аутентификация админа | Supabase Auth (email + password) |
| Сессия клиента | Подписанный HttpOnly-cookie (JWT HS256) |
| Деплой | Vercel |
| Домен | `neyrocontent.ru` (Reg.ru), fallback `neyrocontent.vercel.app` |
| Node | 22 LTS (локально допустим 24) |

Пакетный менеджер: `npm` (локально установлен Node 24 / npm 11; pnpm и Docker отсутствуют).

---

## 5. Границы MVP

### 5.1 Роли

| Роль | Вход | Права |
|---|---|---|
| **Админ (владелец)** | Supabase Auth: email + password. Публичная регистрация отключена. Один аккаунт | Полный CRUD проектов, задач, клиентов, вложений, связей. Все статусы. Управление инвайтами. Просмотр аудита и истории |
| **Клиент** | Инвайт-ссылка `/invite?token=...` → HttpOnly-сессия → `/client` | Видит только свои проекты и задачи. Комментирует, ставит пины, загружает файлы в рамках лимитов. Меняет только разрешённые статусы. Не создаёт и не удаляет задачи. Не видит других клиентов |
| **Гость демо** | Без входа, `/demo` | Только чтение seed-данных. Никаких записей |

### 5.2 Справочник статусов задач

Фиксированный seed-справочник, редактирование через UI не требуется.

| Код | Название | Цвет | Порядок | Кто может установить |
|---|---|---|---|---|
| `new` | Новая | `#64748b` | 1 | админ |
| `in_progress` | В работе | `#3b82f6` | 2 | админ |
| `waiting_client` | Жду клиента | `#f59e0b` | 3 | админ |
| `on_review` | На проверке | `#8b5cf6` | 4 | админ |
| `needs_rework` | На доработке | `#ef4444` | 5 | админ, клиент (из `on_review`) |
| `done` | Принято | `#22c55e` | 6 | админ, клиент (из `on_review`) |

**Переходы клиента (только они):**
- `waiting_client` → `in_progress` — кнопка «Я ответил».
- `on_review` → `done` — кнопка «Принять».
- `on_review` → `needs_rework` — кнопка «На доработку».

Админ может менять статус на любой. Каждое изменение пишется в `task_status_history` и создаёт уведомление второй стороне.

### 5.3 Приоритеты и дедлайны

- Приоритеты: `low` (Низкий), `normal` (Обычный), `high` (Высокий), `urgent` (Срочный) с цветовой маркировкой.
- Дедлайн — дата, отображается в Europe/Moscow. Просроченные задачи подсвечиваются.
- Сортировка в списке: по дедлайну, приоритету, дате создания.

### 5.4 Файлы

| Тип | MIME | Максимум |
|---|---|---|
| JPEG | `image/jpeg` | 500 КБ |
| PNG | `image/png` | 500 КБ |
| WebP | `image/webp` | 500 КБ |
| PDF | `application/pdf` | 500 КБ |
| ZIP | `application/zip` | 2 МБ |
| DOCX | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | 2 МБ |

Правила:
- Максимум **4 вложения на задачу** и **4 вложения на комментарий**.
- GIF, SVG и любые другие типы отклоняются. SVG не принимаем из-за XSS-риска.
- Проверка **на сервере**: расширение + заявленный MIME + magic bytes + фактический размер. Клиентская проверка — только UX-подсказка.
- Bucket `attachments` приватный. Раздача — через signed URL (1 час).
- Имена файлов санитизируются, путь: `{task_id}/{uuid}.{ext}` или `{comment_id}/{uuid}.{ext}`.
- PDF — только скачивание, без предпросмотра. Изображения — предпросмотр + пины.
- Удаление вложения удаляет и объект в Storage, и запись в БД.

### 5.5 Киллер-фича: pin-комментарии

- Клик/тап по изображению открывает модалку комментария.
- Координаты сохраняются в процентах (`pin_x`, `pin_y`, 0–100) относительно **контентной области изображения** с учётом `object-contain` (без учёта letterbox).
- Маркер позиционируется абсолютно в % и не съезжает при ресайзе, смене темы и на мобильных.
- На одном изображении может быть много пинов. Пин привязан к вложению задачи.
- В списке комментариев пин и текст связаны: клик по маркеру подсвечивает комментарий и наоборот.
- Пины доступны админу и клиенту. На изображениях внутри комментариев пины в MVP не ставятся.
- Поддержка клавиатуры и тач-устройств.

### 5.6 Уведомления (in-app)

События:
1. Новый комментарий или пин.
2. Смена статуса задачи.
3. Новый файл.
4. Дедлайн через 24 часа.

Правила:
- Получатель — противоположная сторона. Свои действия не уведомляют.
- Колокольчик в хедере: счётчик непрочитанных, выпадающий список последних 20, «Прочитать все».
- Обновление — polling раз в 30 секунд (без Supabase Realtime, чтобы не усложнять доступ клиента).
- Дедлайны — Vercel Cron раз в сутки (09:00 МСК) через `/api/cron/deadlines`.
- Дубликаты дедлайн-уведомлений исключаются полем `dedupe_key`.

### 5.7 Канбан и список

- Админ: доска по статусам, drag-and-drop между колонками (`@dnd-kit`), оптимистичное обновление, откат при ошибке.
- Карточка: название, проект, клиент, приоритет, дедлайн, счётчики комментариев/вложений, просрочка.
- Фильтры: проект, клиент, приоритет, статус, поиск по названию; переключатель «Доска / Список».
- Клиент: та же доска в режиме чтения; на карточках в `on_review` — кнопки «Принять» / «На доработку»; в `waiting_client` — «Я ответил».
- Демо: доска только для чтения, баннер «Демо-режим».
- На мобильных доска скроллится горизонтально, карточки не ломают layout.

### 5.8 Публичное демо

- Маршрут `/demo` и вложенные `/demo/projects/[id]`, `/demo/tasks/[id]`.
- Без авторизации, без записи. Все кнопки мутаций скрыты или disabled.
- Данные: вымышленный клиент, 2 проекта, ~12 задач во всех статусах, комментарии с пинами, вложения-заглушки.
- Демо-данные помечены `projects.is_demo = true` и **не показываются** в админке (админ видит только реальные данные).
- Демо-страницы рендерятся на сервере через `service_role` со строгим фильтром `is_demo = true`. Публичных RLS-политик на демо-данные нет.
- CTA «Открыть демо» на лендинге.

---

## 6. Модель данных

Все таблицы в схеме `public`, RLS включён на всех. UUID — `gen_random_uuid()`. Везде `created_at timestamptz default now()`, где нужно — `updated_at` + триггер.

### `profiles`
- `id uuid pk references auth.users(id) on delete cascade`
- `email text not null`
- `role text not null default 'admin' check (role in ('admin'))`
- `created_at timestamptz`

Профиль создаётся триггером при создании пользователя в Supabase Auth.

### `clients`
- `id uuid pk`
- `name text not null`
- `company text`
- `email text`
- `invite_token_hash text unique` — SHA-256 от токена, сам токен не хранится
- `invite_expires_at timestamptz`
- `invite_revoked_at timestamptz`
- `session_version int not null default 0` — инкремент при отзыве/перевыпуске инвайта
- `created_at`, `updated_at`

### `projects`
- `id uuid pk`
- `client_id uuid not null references clients(id) on delete cascade`
- `name text not null`
- `description text`
- `is_archived boolean not null default false`
- `is_demo boolean not null default false`
- `created_at`, `updated_at`

### `statuses`
- `code text pk`
- `name text not null`
- `color text not null`
- `sort_order int not null`
- `is_terminal boolean not null default false`
- `created_at`

### `tasks`
- `id uuid pk`
- `project_id uuid not null references projects(id) on delete cascade`
- `status_code text not null references statuses(code) default 'new'`
- `title text not null`
- `description text`
- `priority text not null default 'normal' check (priority in ('low','normal','high','urgent'))`
- `deadline date`
- `position numeric not null default 0` — порядок внутри колонки
- `created_by uuid references profiles(id)`
- `completed_at timestamptz`
- `created_at`, `updated_at`

Индексы: `(project_id, status_code, position)`, `(deadline)`, `(priority)`.

### `task_relations`
- `id uuid pk`
- `parent_task_id uuid not null references tasks(id) on delete cascade`
- `child_task_id uuid not null references tasks(id) on delete cascade`
- `relation_type text not null default 'parent_child' check (relation_type in ('parent_child'))`
- `created_at`
- `unique(parent_task_id, child_task_id)`
- `check (parent_task_id <> child_task_id)`
- Триггер запрещает циклы (рекурсивный CTE). В MVP — один родитель у задачи, много детей.

### `attachments`
- `id uuid pk`
- `task_id uuid references tasks(id) on delete cascade`
- `comment_id uuid references comments(id) on delete cascade`
- `uploaded_by_type text not null check (uploaded_by_type in ('admin','client','demo'))`
- `uploaded_by_name text`
- `file_name text not null`
- `mime_type text not null`
- `size_bytes bigint not null`
- `storage_path text not null unique`
- `width int`, `height int` — для изображений
- `created_at`
- `check ((task_id is not null)::int + (comment_id is not null)::int = 1)`
- Триггер: не более 4 вложений на задачу и не более 4 на комментарий.

### `comments`
- `id uuid pk`
- `task_id uuid not null references tasks(id) on delete cascade`
- `author_type text not null check (author_type in ('admin','client','demo'))`
- `author_id uuid` — `profiles.id` или `clients.id`
- `author_name text not null`
- `body text not null`
- `pinned_attachment_id uuid references attachments(id) on delete set null` — FK добавляется после создания `attachments`
- `pin_x numeric(5,2) check (pin_x between 0 and 100)`
- `pin_y numeric(5,2) check (pin_y between 0 and 100)`
- `created_at`, `updated_at`
- `check` — либо все три поля пина `null`, либо все три заполнены.

### `notifications`
- `id uuid pk`
- `recipient_type text not null check (recipient_type in ('admin','client'))`
- `recipient_id uuid not null`
- `type text not null check (type in ('comment','status_change','file','deadline'))`
- `title text not null`
- `body text`
- `task_id uuid references tasks(id) on delete cascade`
- `project_id uuid references projects(id) on delete cascade`
- `is_read boolean not null default false`
- `dedupe_key text unique` — для дедлайнов
- `created_at`

### `task_status_history`
- `id uuid pk`
- `task_id uuid not null references tasks(id) on delete cascade`
- `from_status text`
- `to_status text not null`
- `changed_by_type text not null check (changed_by_type in ('admin','client','system'))`
- `changed_by_name text`
- `created_at`

### `audit_logs`
- `id uuid pk`
- `actor_type text not null check (actor_type in ('admin','client','system'))`
- `actor_name text`
- `action text not null` — `task.create`, `task.update`, `task.status`, `client.create`, `invite.revoke`, `file.upload`, `file.delete`, `relation.create`, `relation.delete`
- `entity_type text not null`
- `entity_id uuid`
- `payload jsonb`
- `created_at`

Аудит append-only: политик `update`/`delete` нет. UI аудита в MVP не обязателен, данные пишутся.

### Storage
- Bucket `attachments`, приватный, лимит объекта 2 МБ, разрешённые MIME из п. 5.4.
- Публичных политик нет. Доступ только через `service_role` на сервере + signed URL.

---

## 7. Доступ и безопасность

### 7.1 Админ
- Supabase Auth, email + password. Регистрация отключена.
- Админ создаётся пользователем вручную в Supabase Dashboard.
- Любой аутентифицированный пользователь считается админом (в проекте один аккаунт).
- RLS-политики для `authenticated` через функцию `is_admin()`.

### 7.2 Клиент
- Инвайт: 32 случайных байта → `base64url`. В БД хранится только SHA-256.
- Ссылка: `${NEXT_PUBLIC_SITE_URL}/invite?token=...`, срок 30 дней, отзывается и перевыпускается админом.
- `/invite` проверяет хеш, срок и `invite_revoked_at`, затем ставит HttpOnly-cookie `client_session` (JWT HS256, payload `{ clientId, v, iat, exp }`, 30 дней, `SameSite=Lax`, `Secure` в проде) и редиректит на `/client`.
- На каждом запросе сервер проверяет подпись, срок и `session_version`. Отзыв инвайта инкрементит версию и убивает старые сессии.
- Все запросы клиента идут через серверные функции с `service_role` и **обязательным** фильтром по `client_id` (через `projects.client_id`). Клиентский браузер не получает `service_role`.
- RLS для `anon` на клиентские таблицы отсутствует — прямой доступ запрещён.

### 7.3 Демо
- Публичный `/demo` рендерится на сервере с `service_role`, фильтр `projects.is_demo = true`.
- Мутации запрещены: в демо-режиме не вызываются server actions, кнопки скрыты/disabled.

### 7.4 Общие требования
- RLS включён на всех таблицах. Политики: админ — полный доступ; `anon` — запрещено всё (демо и клиент идут через сервер).
- `service_role` импортируется только в файлы с `import 'server-only'`.
- CSRF: server actions + `SameSite=Lax`; внешние POST-роуты проверяют origin.
- Rate limit на `/invite` и `/api/attachments` (простой in-memory лимит на инстанс; для MVP достаточно).
- Никакого `dangerouslySetInnerHTML` для пользовательского контента.
- Security headers: `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `X-Frame-Options: DENY`.
- Тесты изоляции: клиент A не видит проекты/задачи клиента B; демо не видит реальные данные.

---

## 8. Маршруты и экраны

### Публичные
| Маршрут | Назначение |
|---|---|
| `/` | Лендинг: hero, фичи, киллер-фича, CTA в демо, дисклеймер ПДн |
| `/login` | Вход админа |
| `/invite` | Обмен инвайт-токена на сессию и редирект в `/client` |
| `/demo` | Публичное демо: проекты |
| `/demo/projects/[id]` | Демо-проект: доска/список |
| `/demo/tasks/[id]` | Демо-задача: описание, пины, история |

### Админ (защищённые)
| Маршрут | Назначение |
|---|---|
| `/admin` | Дашборд: канбан/список, фильтры, уведомления |
| `/admin/tasks/[id]` | Задача: редактирование, вложения, комментарии, пины, связи, история |
| `/admin/clients` | Клиенты: создание, инвайты, отзыв, проекты |
| `/admin/clients/[id]` | Карточка клиента и его проекты |

### Клиент (по сессии)
| Маршрут | Назначение |
|---|---|
| `/client` | Мои проекты |
| `/client/projects/[id]` | Проект: доска/список, только чтение + согласование |
| `/client/tasks/[id]` | Задача: комментарии, пины, файлы, история, кнопки статусов |

### API
| Маршрут | Назначение |
|---|---|
| `POST/DELETE /api/attachments` | Загрузка/удаление файлов с серверной валидацией |
| `GET/PATCH /api/notifications` | Список, счётчик, отметка прочитанным |
| `GET /api/cron/deadlines` | Vercel Cron: уведомления о дедлайнах, защищён `CRON_SECRET` |
| `GET /api/health` | Health-check для мониторинга |

---

## 9. Визуальная концепция

### 9.1 Настроение
Тёмный «премиальный техно»-стиль из `reference.jpg`: глубокий синий фон, стеклянные панели с blur, неоновые акценты cyan/violet/magenta, тонкие светящиеся линии, изометрическая доска, парящие карточки. Без тяжёлого WebGL и внешних 3D-ассетов.

### 9.2 Палитра
- Фон: `#070b14`, `#0b1220`.
- Стекло: `rgba(15,23,42,0.6)` + `backdrop-blur`.
- Акценты: cyan `#22d3ee`, violet `#8b5cf6`, magenta `#f472b6`.
- Успех `#22c55e`, предупреждение `#f59e0b`, ошибка `#ef4444`.
- Светлая тема: `#f8fafc` фон, белое стекло, те же акценты, мягкие тени. Тёмная — по умолчанию.

### 9.3 Типографика
- Заголовки: Manrope (700/800).
- Текст: Inter (400/500/600).
- Подключение через `next/font`, без внешних CDN.

### 9.4 Изометрия и 3D
- Hero лендинга: CSS 3D-композиция доски (`rotateX/rotateZ`), слои glass-панелей, неоновые «дороги», парящие карточки задач и пины.
- Лёгкий parallax на Framer Motion, отключается при `prefers-reduced-motion`.
- Никаких WebGL/Three.js.

### 9.5 Логотипы
- `public/logo.svg` и `public/logo-dark.svg`.
- Изометрический знак: куб/доска с чекмарком и пином, градиент cyan→violet. Минималистично, читаемо в 24 px.

### 9.6 UI-требования
- shadcn/ui с кастомной темой под референс.
- Канбан, карточки, модалки, тосты (`sonner`), скелетоны, пустые состояния.
- Адаптив от 360 px. На мобильных — горизонтальный скролл доски, стеклянные панели не ломают layout.
- Доступность: контраст, focus-ring, клавиатура, alt-тексты.
- Дисклеймер ПДн в футере всех публичных и клиентских страниц.

---

## 10. План по этапам

### ЭТАП 1: Инициализация и база данных

**Действия агента:**
1. Инициализировать Next.js (App Router, TS strict), Tailwind, shadcn/ui, линтер, `git init`, `.gitignore`.
2. Создать `.env.example` только с названиями переменных.
3. Написать `supabase/migrations/0001_init.sql`:
   - все таблицы из раздела 6;
   - индексы, `updated_at`-триггеры;
   - триггер истории статусов;
   - триггер запрета циклов в связях;
   - триггер лимита 4 вложений;
   - RLS-политики и функцию `is_admin()`;
   - bucket `attachments` и ограничения Storage.
4. Подготовить `supabase/seed.sql`: справочник статусов + демо-клиент/проекты/задачи без вложений.
5. Настроить тему (dark/light), базовый layout, шрифты.
6. Создать `PROGRESS.md`.

**Участие пользователя (агент выдаёт инструкцию):**
- Применить SQL в Supabase SQL Editor.
- Создать админа в Authentication → Users, отключить регистрацию.
- Заполнить `.env.local` самостоятельно.

**🛑 Отчёт:** структура, `.env.example`, SQL (таблицы, связи, RLS, лимиты, bucket), `PROGRESS.md`.
**Команда:** «Этап 1 принят, применяю SQL и продолжаю».

---

### ЭТАП 2: Лендинг, 3D-элементы и аутентификация

**Действия агента:**
1. Изучить `reference.jpg`, зафиксировать дизайн-токены.
2. Создать `logo.svg` и `logo-dark.svg`.
3. Лендинг `/`: CSS-изометрия, glass/neon, фичи, демо-CTA, дисклеймер ПДн.
4. Вход админа `/login` (Supabase Auth), защита `/admin`, выход.
5. Управление клиентами: создание, генерация инвайта, отзыв, перевыпуск.
6. `/invite`: обмен токена на сессию, редирект в `/client`.
7. Тёмная/светлая тема, переключатель.

**🛑 Отчёт:** лендинг и логотип vs `reference.jpg`, генерация инвайта, дисклеймер.
**Команда:** «Этап 2 принят, переходи к админке».

---

### ЭТАП 3: Админка, канбан и файлы

**Действия агента:**
1. Дашборд `/admin`: канбан с drag-and-drop, список, фильтры, поиск.
2. CRUD задач: создание, редактирование, удаление, приоритет, дедлайн, описание.
3. Связи задач: выбор родительской/дочерней, запрет циклов, отображение дерева.
4. Загрузка файлов в Supabase Storage: серверная валидация размера/типа/magic bytes, лимит 4 на задачу и 4 на комментарий, signed URL, удаление.
5. Управление клиентами и проектами, привязка проектов к клиенту.
6. Уведомления и аудит для действий админа.
7. `PROGRESS.md`.

**🛑 Отчёт:** канбан, код валидации файлов (блокировка >500 КБ/2 МБ и запрещённых типов), создание задачи и связывание.
**Команда:** «Этап 3 принят, делай киллер-фичу».

---

### ЭТАП 4: Pin-комментарии, клиентский портал, демо

**Действия агента:**
1. Компонент `ImagePinComment`: клик/тап → координаты в %, маркер, модалка, список, ресайз.
2. Клиентский портал `/client`: свои проекты, доска/список, задача, комментарии, файлы, история статусов.
3. Разрешённые переходы статусов клиентом + уведомления админу.
4. Колокольчик уведомлений (админ и клиент), polling 30 сек, отметка прочитанным.
5. Публичное демо `/demo`: seed-данные, read-only, изоляция от реальных данных, баннер.
6. `PROGRESS.md`.

**🛑 Отчёт:** работа пинов (координаты в %), изоляция клиента A/B, демо без входа.
**Команда:** «Этап 4 принят, готовь к деплою».

---

### ЭТАП 5: Деплой, документация, финализация

**Действия агента:**
1. Подготовить проект к Vercel: `vercel.json` с cron `/api/cron/deadlines` (09:00 МСК), переменные окружения, проверка build.
2. `README.md`: описание, стек, схема БД в Mermaid, роли, запуск, деплой, дисклеймер ПДн, упоминание `reference.jpg`.
3. Инструкция по домену `neyrocontent.ru` на Reg.ru: apex A-запись (значение покажет Vercel), `www` CNAME, fallback `neyrocontent.vercel.app`.
4. Финальный seed демо-данных и проверка `/demo`.
5. `PROGRESS.md` → «100% Завершено».

**Участие пользователя:** подключить GitHub-репозиторий к Vercel, задать env, добавить домен и DNS-записи в Reg.ru.

**🛑 Отчёт:** README, DNS-инструкция, live-ссылки.
**Команда:** «Проект готов. Ожидаю команды на финальный коммит».

---

## 11. Definition of Done

- [ ] `npm run lint`, `npm run typecheck`, `npm run build` — без ошибок.
- [ ] Нет секретов в репозитории, логах и клиентском бандле; `.env.local` в `.gitignore`.
- [ ] RLS включён на всех таблицах; `anon` не имеет прямого доступа; `service_role` только на сервере.
- [ ] Клиент A не видит данные клиента B (проверено тестом/чек-листом).
- [ ] Демо не показывает реальные данные и не позволяет мутации.
- [ ] Все мутации и загрузки валидируются на сервере.
- [ ] Лимиты файлов и типы работают; SVG/GIF отклоняются.
- [ ] Пины не съезжают при ресайзе и на мобильных.
- [ ] Канбан работает drag-and-drop; клиентские переходы статусов работают.
- [ ] Уведомления создаются по 4 событиям, счётчик и «прочитать все» работают.
- [ ] Светлая/тёмная темы, адаптив от 360 px, клавиатурная доступность.
- [ ] Дисклеймер ПДн в README и футере.
- [ ] README, `PROGRESS.md`, Mermaid-схема, DNS-инструкция готовы.
- [ ] Прод на Vercel открывается, `/demo` доступен без входа.

---

## 12. Переменные окружения (`.env.example`)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CLIENT_SESSION_SECRET=
NEXT_PUBLIC_SITE_URL=
CRON_SECRET=
```

- `CLIENT_SESSION_SECRET` и `CRON_SECRET` генерируются пользователем: `openssl rand -base64 32`.
- В Vercel значения задаются в Project → Settings → Environment Variables.
- Агент не читает и не выводит `.env.local`.

---

## 13. Участие пользователя: пошагово

### 13.1 Supabase (Этап 1)

1. Открыть проект на supabase.com → **SQL Editor** → **New query**.
2. Вставить содержимое `supabase/migrations/0001_init.sql` → **Run**.
3. Проверить: **Table Editor** — появились таблицы; **Storage** — bucket `attachments`.
4. **Authentication → Providers → Email**: включить, отключить «Allow new users to sign up».
5. **Authentication → Users → Add user**: создать админа (email + пароль). Пароль агенту не сообщать.
6. **Project Settings → API**: скопировать `Project URL`, `anon public`, `service_role` в `.env.local` (файл создаётся из `.env.example`). Значения не отправлять в чат.
7. Сгенерировать секреты: `openssl rand -base64 32` для `CLIENT_SESSION_SECRET` и `CRON_SECRET`.
8. Указать `NEXT_PUBLIC_SITE_URL=http://localhost:3000` для локалки.
9. Выполнить `npm install` и `npm run dev`.
10. Если SQL выдал ошибку — прислать текст ошибки (без ключей).

### 13.2 Vercel (Этап 5)

1. Запушить репозиторий на GitHub.
2. Vercel → **Add New → Project** → импортировать репозиторий. Framework: Next.js.
3. **Settings → Environment Variables**: добавить все переменные из `.env.example` с прод-значениями. `NEXT_PUBLIC_SITE_URL=https://neyrocontent.ru`.
4. **Deploy**.
5. **Settings → Domains → Add**: `neyrocontent.ru`.
6. Vercel покажет DNS-записи. Для apex обычно `A @ → 76.76.21.21`; для `www` — `CNAME www → cname.vercel-dns.com`. Точные значения брать из Vercel.
7. Reg.ru → домен → **DNS-серверы и зоны** → добавить записи, сохранить. Подождать выпуск SSL.
8. Если apex не подтверждается — использовать `www` с редиректом на apex или fallback `neyrocontent.vercel.app`.

---

## 14. Допущения и открытые вопросы

Принятые допущения (менять не требуется):
- Публичное демо — **read-only**. Если нужен интерактивный песочный режим с сохранением изменений — это отдельная задача.
- PDF — только скачивание; предпросмотр не нужен.
- У задачи один родитель, много детей; тип связи только `parent_child`.
- Комментарии можно удалять (автор/админ), редактирование в MVP не требуется.
- Справочник статусов фиксирован, UI редактирования нет.
- Один админ, без публичной регистрации.
- Интерфейс только на русском.
- Реальные ПДн не используются.

Открытые вопросы: нет. При изменении допущений — обновить этот раздел и `PROGRESS.md`.

---

## 15. Шаблон `PROGRESS.md`

```markdown
# Прогресс разработки: Трекер задач (Portfolio MVP)
**Текущий статус:** [В процессе / Завершен]
**Последнее обновление:** [Дата и время]

- [x] Этап 1: Инициализация и База Данных (SQL готов, .env.example создан)
- [ ] Этап 2: Лендинг, 3D-элементы и Аутентификация
- [ ] Этап 3: Админка, канбан и файлы
- [ ] Этап 4: Pin-комментарии, клиентский портал, демо
- [ ] Этап 5: Деплой, документация, финализация

**Заметки для следующего агента:**
- [какие таблицы созданы, какие компоненты требуют доработки, какие переменные окружения ожидает]
```
