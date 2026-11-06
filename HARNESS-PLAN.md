# Трекер задач (Portfolio MVP): анализ ТЗ и конфигурация DSH

**Дата:** 06.11.2026  
**Статус:** предложение, до реализации  
**Входные документы:** `../03 Трекер 3/TS.md` (v2.0), `../03 Трекер 3/reference.jpg`

---

## 0. Коротко

Это не «ещё один лендинг», а полноценный full-stack MVP: 3 роли, 11 таблиц, RLS, Supabase Auth + собственная клиентская сессия, приватный Storage, канбан с DnD, pin-комментарии, уведомления, публичное демо и деплой на Vercel. По объёму — 5 этапов и примерно 30–45 файлов кода.

Главные риски не в вёрстке, а в **изоляции клиентов**, **файлах**, **пинах** и **ручном применении SQL**. Именно туда нужно направить проверки и токены.

Предлагаю такую конфигурацию:

- профиль `web`, модель `deepseek-flash` с `reasoningEffort: high` (vision + 1M контекста, без смены модели посреди сессии);
- песочница `workspace-write`, approvals `ask`, никакого `danger-full-access`;
- одна сессия на этап (а Stage 3 и 4 — на две подсессии), передача состояния через `PROGRESS.md`, без «простыней» ТЗ в каждом запросе;
- 2 обязательных плагина: **cc-safety-net** (запрет чтения `.env*`, SSH-ключей и разрушительных команд) и **dsh-pilot** (браузерная проверка UI через accessibility-tree, без vision и без твоего Chrome-профиля);
- 1 опциональный: **dsh-context** (панель расхода контекста, без model-tools);
- **никаких MCP** к Supabase/Vercel/GitHub — они требуют токены и обходят ручной контроль SQL;
- секреты: агент **никогда** не читает `.env.local`; dev-сервер запускаешь ты; сборка проверяется в чистой копии без `.env.local`;
- от тебя: 3 команды установки плагинов, Supabase SQL + админ + `.env.local`, 5 подтверждений этапов и действия в Vercel/Reg.ru.

---

## 1. Анализ ТЗ

### 1.1. Что именно строится

| Слой | Содержание |
|---|---|
| Публичное | Лендинг `/`, вход `/login`, инвайт `/invite`, демо `/demo`, `/demo/projects/[id]`, `/demo/tasks/[id]` |
| Админ | `/admin` (канбан/список/фильтры), `/admin/tasks/[id]`, `/admin/clients`, `/admin/clients/[id]` |
| Клиент | `/client`, `/client/projects/[id]`, `/client/tasks/[id]` — только свои проекты, комментарии, файлы, разрешённые переходы |
| API | `/api/attachments`, `/api/notifications`, `/api/cron/deadlines`, `/api/health` |
| Данные | `profiles`, `clients`, `projects`, `statuses`, `tasks`, `task_relations`, `attachments`, `comments`, `notifications`, `task_status_history`, `audit_logs` + Storage bucket `attachments` |
| Киллер-фича | Pin-комментарии на изображениях: координаты в %, модалка, список, ресайз, клавиатура, тач |

### 1.2. Объём и сложность по этапам

| Этап | Что делается | Сложность | Главный риск |
|---|---|---|---|
| 1 | Next.js + Tailwind + shadcn, SQL (таблицы, RLS, триггеры, bucket), seed, тема, `PROGRESS.md` | Высокая | SQL применяется вручную; ошибка в RLS/триггерах блокирует всё |
| 2 | Лендинг с CSS-изометрией, логотипы, Supabase Auth, клиенты/инвайты, темы | Средняя | Визуал «как на референсе» без WebGL; успеть с полировкой |
| 3 | Канбан + DnD, CRUD задач, связи, файлы, уведомления, аудит | Очень высокая | Изоляция, лимиты файлов, атомарность статусов |
| 4 | Пины, клиентский портал, демо, колокольчик | Очень высокая | Геометрия пинов, изоляция A/B, read-only демо |
| 5 | Vercel, cron, README, Mermaid, DNS, финальный seed | Средняя | Домен/apex, env в Vercel, cron 09:00 МСК |

### 1.3. Технические риски и решения

1. **Изоляция клиентов.** `service_role` обходит RLS, поэтому утечка возможна только через забытый `client_id`. Решение: один `requireClient()` + repository-слой, где `clientId` — обязательный аргумент каждой функции; отдельный тест A/B через dev-инвайты.
2. **`service_role` в клиентском бандле.** Решение: единственный модуль `lib/supabase/admin.ts` с `import 'server-only'`; проверка `grep` по `"use client"` и по бандлу; health-check не печатает ключи.
3. **Файлы.** Нужны расширение + заявленный MIME + magic bytes + фактический размер + лимит 4 на задачу/комментарий. `file-type` проверяет DOCX корректно (проверено), размеры изображений — через `image-size`. Загрузка — route handler, а не server action, чтобы не упереться в лимит тела; на Vercel лимит функции 4.5 МБ, наши 2 МБ проходят.
4. **Pin-координаты.** Если считать проценты от контейнера с `object-contain`, легко получить сдвиг из-за letterbox. Решение: обёртка `inline-block` вокруг `<img>` — её размер совпадает с контентной областью; проценты считаются от неё. Чистая функция + unit-тесты на ресайз.
5. **Баг в схеме ТЗ: `pinned_attachment_id ... on delete set null`.** Условие «либо все три поля null, либо все три заполнены» нарушится: FK обнулит только id, а `pin_x/pin_y` останутся. Решение: `before delete` триггер на `attachments`, который обнуляет все три поля у комментариев; либо `on delete cascade` для комментария. Я выберу триггер + сохранение комментария.
6. **Next.js 16, а не 15.** Актуальный стабильный — 16.4.5: `middleware.ts` переименован в `proxy.ts`, `cookies()`/`params` асинхронные, `next lint` удалён (нужен `eslint .`), Tailwind 4. Это надо зафиксировать до старта, иначе агент напишет код по памяти под Next 15.
7. **Ручной Supabase.** SQL применяет пользователь, агент не видит БД. Решение: SQL в транзакции `begin/commit`, идемпотентные объекты, `/api/health` проверяет `statuses` и bucket без раскрытия секретов; при ошибке пользователь присылает только текст ошибки.
8. **Демо не должно светиться в админке.** `projects.is_demo` есть, но демо-клиент всё равно попадёт в `/admin/clients`. Решение: добавить `clients.is_demo` (маленькое расширение схемы) и фильтровать везде; демо-вложения отдавать из `public/demo-assets`, не из Storage.
9. **Дедлайн-уведомления.** В ТЗ не сказано, кому идёт уведомление от cron. Решение: и админу, и клиенту; `dedupe_key` включает получателя, иначе один из двух не получит.
10. **npm-кэш вне workspace.** Песочница `workspace-write` не даст писать в `~/.npm`; `npm install` упадёт с EPERM. Решение: `.npmrc` с `cache=.npm-cache` внутри проекта (проверено — работает). Сборка — в чистой копии без `.env.local`.

### 1.4. Что фиксируем до старта (`docs/DECISIONS.md`)

- Next.js `16.4.5`, React `19.3.1`, Tailwind `4.3.4`, Supabase JS `2.119.0`, SSR `0.12.7`.
- `proxy.ts` вместо `middleware.ts`; `await cookies()`, `await params`.
- Демо-вложения — локальные PNG в `public/demo-assets`, не Storage.
- `clients.is_demo` — расширение схемы.
- Дедлайн — обоим получателям, dedupe по получателю.
- Пин-комментарий: обёртка вокруг изображения; удаление вложения обнуляет все три поля пина.
- Смена статуса — атомарный Postgres-RPC (`change_task_status`), который пишет историю, уведомление и аудит; триггер истории остаётся.
- UI аудита в MVP нет; данные пишутся.
- Node на Vercel — 22.x; локально 24 допустим.
- Пакетный менеджер — npm с локальным кэшем.

---

## 2. Приоритеты и компромиссы

Приоритеты: **безопасность паролей → экономия токенов → минимальное участие**. Если автоматизация конфликтует с секретами, выигрывает безопасность.

| Приоритет | Решение | Компромисс |
|---|---|---|
| Пароли и ключи | Агент никогда не читает `.env.local`; cc-safety-net блокирует; dev-сервер запускает пользователь; сборка в чистой копии | Агент не может сам перезапустить dev-сервер и не делает E2E админки без твоего логина |
| Токены | Одна сессия на этап, `PROGRESS.md`, точечные чтения, subagent-саммари, никакого auto-review | Stage 3/4 дробятся на 2 сессии; чуть больше ручных «продолжай» |
| Минимальное участие | 5 гейтов, остальное делает агент; браузерные проверки через dsh-pilot | Supabase SQL, `.env.local`, Vercel и DNS остаются на тебе — это действия с аккаунтами |
| Скорость | Готовые shadcn-компоненты, dnd-kit, Supabase SDK | Не изобретаем свои примитивы; чуть больше зависимостей |

---

## 3. Конфигурация DSH

### 3.1. Основные параметры

| Параметр | Значение | Почему |
|---|---|---|
| Профиль | `web` (текущий) | Web GUI, сессии, approvals, плагины |
| Модель | `deepseek-flash`, `reasoningEffort: high` | Vision для `reference.jpg`, 1M контекста, дешевле v4-pro; не меняем модель посреди сессии, чтобы не рвать KV-cache |
| Пресет | `standard` | Полный набор инструментов, plan mode, subagents, compaction, todo |
| Песочница | `workspace-write` | Запись только в проект; никакого full-access |
| Approvals | `ask` | Эскалации только по необходимости; в проекте всё пишется внутри workspace |
| Рабочая папка | `.../07 Трекеры/Трекер 3` | Текущая пустая папка; `TS.md` и `reference.jpg` копируются в `docs/` |
| Контекст | Новая сессия на этап | 5 этапов ≈ 5–7 сессий по 80–150k токенов вместо одной на 800k+ |
| Память | `PROGRESS.md` + `docs/DECISIONS.md` + git | Без memory-плагинов, которые льют контекст в каждый запрос |
| MCP | Нет | Не даём агенту токены Supabase/Vercel/GitHub и не обходим ручной SQL |
| Браузер | dsh-pilot, isolated context | Проверка localhost без твоего Chrome-профиля и без vision-токенов |

### 3.2. Сессии и передача состояния

```
Stage 0  setup + каркас                    → 1 сессия
Stage 1  SQL + тема + layout               → 1 сессия
Stage 2  лендинг + auth + клиенты/инвайты  → 1 сессия
Stage 3a канбан + CRUD + связи             → 1 сессия
Stage 3b файлы + уведомления + аудит       → 1 сессия
Stage 4a пины + карточка задачи            → 1 сессия
Stage 4b клиентский портал + демо          → 1 сессия
Stage 5  deploy + README + DNS             → 1 сессия
```

Правила перехода:

- в начале сессии читаются только `PROGRESS.md`, `AGENTS.md` и нужный раздел `docs/TS.md`;
- в конце — обновлённый `PROGRESS.md` (≤ 80 строк), git-коммит, короткий отчёт;
- если сессия подошла к ~150k токенов — не «дожимать», а завершить подэтап и начать новую;
- compaction не трогаем: при таком режиме он почти не понадобится, а один его вызов дороже новой сессии.

### 3.3. Subagents: где реально экономят

| Задача | Кому | Что возвращает |
|---|---|---|
| Свежие версии Next 16/Supabase/Tailwind и breaking changes | research-subagent | 10–15 тезисов со ссылками, без полного контекста |
| Ревью SQL: RLS, политики, триггеры, bucket | review-subagent (read-only) | Список findings + патчи, без пересказа ТЗ |
| Проверка `service_role`/секретов в бандле | security-subagent | Список файлов/строк и вердикт |
| Визуальный QA и клиентские сценарии | dsh-pilot в основной сессии | Скриншоты + console errors + a11y-снимки |

Не делегируем параллельную запись кода в одни и те же файлы: конфликты и лишние токены. Subagent пишет только изолированный кусок или возвращает рекомендации.

### 3.4. `AGENTS.md` (короткий, ≤ 100 строк)

Обязательные разделы:

1. **Проект и источники истины:** `docs/TS.md`, `docs/DECISIONS.md`, `docs/DESIGN.md`, `PROGRESS.md`.
2. **Секреты:** никогда не читать `.env*` (кроме `.env.example`), не печатать ключи, не запускать `env/printenv`, не делать `vercel env pull`, не просить пароли. Если секрет случайно попал в чат — не повторять, сказать «ротируй».
3. **Запуск:** `npm run dev` запускает только пользователь; агент ходит на `localhost:3000`; сборка — через `scripts/verify-build.sh` в чистой копии.
4. **Этапы:** без «Продолжай» следующий этап не начинать; обновлять `PROGRESS.md`; коммит после этапа.
5. **Код:** TypeScript strict, server actions/route handlers, zod-валидация, русский UI, никакого `dangerouslySetInnerHTML`, `service_role` только в `server-only`.
6. **Токены:** `rg` перед чтением, читать диапазонами, не выводить целые файлы, не читать `node_modules`, не делать скриншоты без необходимости.
7. **Проверки:** `npm run lint`, `typecheck`, `test`, `build`; чек-лист DoD из ТЗ.
8. **Данные:** только вымышленные имена/email/телефоны; дисклеймер ПДн дословно.

### 3.5. Проектные skills (`.dsh/skills/`)

| Skill | Когда загружается | Что внутри |
|---|---|---|
| `supabase-rls-review` | Перед/после написания SQL | Чек-лист RLS, `is_admin()`, grants, storage policies, триггеры, `service_role`, фильтры `client_id` |
| `ui-visual-qa` | После сборки экрана | Как водить dsh-pilot, viewport 360/768/1440, dark/light, reduced motion, что сверять с `reference.jpg` |
| `release-security` | Перед этапом 5 и перед push | Скан секретов, `.gitignore`, бандл, cookie-флаги, headers, rate limit, изоляция A/B, демо read-only |

Скиллы — файлы в репозитории, а не плагины: дешевле, прозрачнее, ревьюятся в git.

### 3.6. Кэши и окружение

`.npmrc` в проекте:

```ini
cache=.npm-cache
fund=false
audit=false
loglevel=error
```

Это обязательно: иначе `npm install` пытается писать в `~/.npm`, а песочница это запрещает. `node_modules`, `.next`, `.npm-cache`, `.dsh-pilot` — в `.gitignore`.

Сборка без секретов — `scripts/verify-build.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
rsync -a \
  --exclude node_modules --exclude .next --exclude .git \
  --exclude .env.local --exclude .env --exclude .npm-cache --exclude .dsh-pilot \
  "$ROOT/" "$TMP/"
ln -s "$ROOT/node_modules" "$TMP/node_modules"
cd "$TMP"
NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co" \
NEXT_PUBLIC_SUPABASE_ANON_KEY="placeholder" \
NEXT_PUBLIC_SITE_URL="http://localhost:3000" \
SUPABASE_SERVICE_ROLE_KEY="placeholder" \
CLIENT_SESSION_SECRET="placeholder-secret-placeholder-secret" \
CRON_SECRET="placeholder" \
npm run build
```

Смысл: билд не видит реальных ключей; если страница на этапе сборки лезет в БД — это баг, её нужно сделать `force-dynamic`.

---

## 4. Плагины

### 4.1. Обязательные

| Плагин | Версия | Роль | Токены | Риск |
|---|---|---|---|---|
| **cc-safety-net** | `2.7.4` | Deny-only guard: блокирует чтение `.env*`, SSH-ключей, `~/.aws`, `.npmrc`, coding-CLI credentials; блокирует `rm -rf`, `git reset --hard`, `git push --force`, `curl \| bash` | Почти нуль: model-tools не добавляет, только редкие notice | Читает пути/команды; локальный, без сети; при сбое загрузки профиль работает без защиты — проверяем `doctor` |
| **dsh-pilot** | `0.1.1` | Браузер: navigate/snapshot/act/wait/screenshot/close по accessibility-ref, localhost всегда разрешён, isolated context, пароли в поля не печатает | 6 tool-схем + a11y-снимки (дешевле скриншотов) | Молодой плагин; fallback — 30-строчный Playwright-скрипт |

Установка (в терминале, не в чате):

```bash
npx -y cc-safety-net@2.7.4 install --deepseek-harness
npx cc-safety-net doctor

dsh plugin --profile web add dsh-pilot@0.1.1
```

Проверка:

```bash
npx cc-safety-net explain 'cat .env.local'     # должно быть заблокировано
npx cc-safety-net explain 'cat .env.example'   # должно быть разрешено
```

Если `.env.example` тоже блокируется — попроси добавить allow-path только для него (файл без секретов).

Я проверил поведение на `cc-safety-net@2.7.4`: `cat .env.local` блокируется с правилом `secret.pattern.env-variant`, `cat .env.example` проходит. То есть базовый сценарий «агент не читает твои ключи» закрывается без настройки.

### 4.2. Опциональный

| Плагин | Версия | Зачем | Почему можно пропустить |
|---|---|---|---|
| **dsh-context** | `0.82.1` | Панель контекста, `/context`, разбивка по tool calls/reasoning, тренд | Это UI-удобство; штатный token-meter уже показывает расход |

```bash
dsh plugin --profile web add dsh-context@0.82.1
```

### 4.3. Что НЕ ставим и почему

| Плагин/класс | Причина |
|---|---|
| `dsh-auto-review`, Auto review | Один дополнительный model-запрос **на каждый tool call** — главный убийца токенов; для наших рисков хватает sandbox + approvals |
| `dsh-auto-mode` | Не поддерживает 0.2.1-rc.5 (peer только 0.2.0-rc.2) |
| Memory-плагины (Hindsight, OpenViking, MemOS, memsearch) | Льют контекст в каждый запрос, могут сохранять чувствительные данные; `PROGRESS.md` + git достаточно |
| `billion-context` | Внешний сервис сжатия контекста + network/env; не готов отдавать ему код и секреты |
| Vision-роутеры | Текущая модель уже vision; лишние ключи и токены |
| Agent Teams / Ralph / Worktree | Для соло-проекта это лишняя сложность и расход; git-ветки и subagents покрывают |
| Supabase/Vercel/GitHub MCP | Требуют личных токенов, расширяют доступ и обходят ручной контроль SQL/деплоя |
| `dshmarket`, theme/skin-паки | Не относятся к задаче; каждый плагин — это код с правами |

### 4.4. Патч профиля для dsh-pilot

После установки добавить в `~/.dsh/profiles/web/cordis.patch.yml` (или через Plugins UI):

```yaml
- id: pilot
  config:
    headless: true
    allowedOrigins:
      - neyrocontent.ru
      - neyrocontent.vercel.app
    allowPasswordFields: false
    profileDir: ""
```

`profileDir: ""` — принципиально: пустой профиль означает свежий изолированный контекст без твоих залогиненных сессий. `allowedOrigins` понадобятся только на Stage 5; localhost работает всегда.

---

## 5. Безопасность паролей и ключей

### 5.1. Модель угрозы

DSH-песочница ограничивает **запись**, но **чтение** вне workspace не ограничено. Значит, `.env.local`, лежащий в проекте, технически доступен агенту. Это закрывается тремя слоями:

1. **cc-safety-net** — детерминированный запрет чтения `.env*`, SSH, cloud-креденшелов.
2. **AGENTS.md** — правило «не читать, не печатать, не просить».
3. **Процесс** — агент не запускает процессы, которые загружают секреты.

### 5.2. Правила

- Пользователь сам создаёт `.env.local` из `.env.example`; в чат значения не попадают.
- `.env.local` — `chmod 600`, в `.gitignore`; в репозиторий только `.env.example` с именами.
- Агент **не запускает** `npm run dev` / `next start`, потому что Next.js загрузит `.env.local` в процесс. Dev-сервер запускает пользователь.
- Агент **не делает** `env`, `printenv`, `set`, `export -p`, `cat .env*`, `vercel env pull`, `supabase login`, `gh auth token`.
- Сборка — `scripts/verify-build.sh` в чистой копии без `.env.local`, с фиктивными public-переменными.
- `SUPABASE_SERVICE_ROLE_KEY` — только `lib/supabase/admin.ts` с `import 'server-only'`; проверка `grep` и бандла.
- `CLIENT_SESSION_SECRET`/`CRON_SECRET` — только server-only; cookie `HttpOnly`, `Secure` в проде, `SameSite=Lax`.
- Клиентская сессия проверяет `session_version` на каждом запросе; отзыв инвайта инкрементит версию.
- Все клиентские запросы — через server-side repository с обязательным `clientId`; RLS — второй слой, не единственный.
- Демо — read-only, service_role, фильтр `is_demo = true`; никаких публичных RLS-политик.
- Если секрет засветился — ротация; агент не повторяет значение и не пишет его в файлы.
- Перед push — `release-security` skill: `git log --all -- .env.local`, скан трекаемых файлов, проверка бандла.

### 5.3. Практический сценарий секретов

```
1. Ты создаёшь .env.local (600) из .env.example, значения — из Supabase Dashboard.
2. Ты запускаешь `npm run dev` в своём терминале (не в чате).
3. Агент ходит на http://localhost:3000 и проверяет UI; секретов не видит.
4. Агент собирает проект в /tmp без .env.local; билд не знает ключей.
5. Ты задаёшь env в Vercel Dashboard; агент не делает `vercel env`.
```

Продвинутый вариант, если есть 1Password/Bitwarden CLI: `.env.op` содержит только ссылки `op://...`, запуск — `op run --env-file=.env.op -- npm run dev`. На диске нет секретов, агент видит только ссылки. Это лучший вариант для «пароли неприкосновенны», но требует твоего CLI.

### 5.4. Админка без пароля

Агент не должен знать пароль админа. Поэтому:

- публичные страницы, демо и клиентский портал тестируются автоматически;
- для E2E админки — либо твой короткий ручной чек-лист, либо «assisted login»: запускаем dsh-pilot в headed-режиме, ты сам входишь (можно по magic-link из Supabase Dashboard), агент водит уже залогиненную сессию и не видит пароль. После проверки контекст закрывается.

### 5.5. Dev-инвайты для автотестов клиента

В `supabase/seed.dev.sql` — два тестовых клиента с известными dev-токенами (`dev-client-a-token`, `dev-client-b-token`) и проектами/задачами. Агент открывает `/invite?token=...` в двух cookie-jar и проверяет изоляцию A/B, загрузку файлов, переходы статусов — без админского пароля. Перед продом эти записи удаляются `cleanup.dev.sql`.

---

## 6. Экономия токенов

### 6.1. Ориентиры

- `TS.md` — ~40 КБ, ~11k токенов; читать целиком 5 раз = 55k впустую.
- `reference.jpg` — до ~1k vision-токенов за просмотр; смотреть 1–2 раза, затем работать по `docs/DESIGN.md`.
- Одна сессия этапа — целевой бюджет 80–150k токенов.
- Весь проект — ориентировочно 1.3–2.5M токенов; без сессий по этапам и с auto-review легко получить 3–5M.

### 6.2. Приёмы

1. Новая сессия на этап; `PROGRESS.md` вместо истории чата.
2. `rg`/`grep` перед `read`; читать диапазоны, не файлы целиком.
3. Один раз извлечь дизайн-токены из референса в `DESIGN.md` (палитра, шрифты, стекло, изометрия, motion) и дальше ссылаться на него.
4. dsh-pilot — accessibility-снимки вместо скриншотов; скриншот только для человека/финального QA.
5. Subagents возвращают 10–15 тезисов/список findings, а не пересказ.
6. Не выводить полные логи: `| tail -30`, `git diff --stat` перед diff.
7. Не читать `node_modules`, `.next`, `package-lock.json` целиком.
8. Не устанавливать плагины с model-tools «на всякий случай»: каждая схема — в каждом запросе.
9. Не использовать auto-review и memory-плагины.
10. Не гонять `npm run build` после каждой мелочи: `lint` + `typecheck` дешевле; build — на гейте.
11. Stage 3 и 4 дробить: одна большая сессия почти наверняка упрётся в compaction.
12. Кэш npm — локальный, чтобы установки не падали и не тратили время.

### 6.3. Что не оптимизируем в ущерб качеству

- Не снижаем reasoning до `low` на архитектуре, SQL и пинах: итерации дороже.
- Не экономим на unit-тестах чистой логики (пины, переходы, файлы): они ловят баги дешевле, чем UI-прогоны.
- Не отключаем `typecheck`/`build` на гейтах.

---

## 7. Минимальное участие

### 7.1. Что делаешь только ты

| Когда | Действие | Время |
|---|---|---|
| Сейчас | 2–3 команды установки плагинов + перезапуск DSH | 5 мин |
| Stage 1 | Применить `0001_init.sql` в Supabase SQL Editor; создать админа; отключить signup; заполнить `.env.local`; запустить `npm run dev` | 15–20 мин |
| Stage 1 | Применить `seed.sql` (и `seed.dev.sql` для тестов) | 5 мин |
| Stage 1–5 | 5 подтверждений этапов («Продолжай») | по 1 мин |
| Stage 3/5 | По желанию: assisted login в админку или ручной чек-лист | 10 мин |
| Stage 5 | GitHub-репозиторий, Vercel import, env, домен, DNS в Reg.ru | 20–30 мин |

### 7.2. Что делает агент

Всё остальное: каркас, SQL, seed, код, стили, компоненты, тесты, проверки, скриншоты, README, Mermaid, `vercel.json`, инструкции по DNS, git-коммиты, отчёты.

### 7.3. Формат гейта

```markdown
## Этап N принят?
- Сделано: ...
- Проверено: lint / typecheck / test / build (ссылки/вывод)
- Скриншоты: ...
- Что осталось: ...
- Твои действия: ...
Команда: «Этап N принят, продолжаю»
```

Без этой команды следующий этап не начинается — как требует ТЗ.

---

## 8. План этапов

### Stage 0. Подготовка (до этапа 1)

- Скопировать `TS.md` и `reference.jpg` в `docs/`.
- `git init`, `.gitignore`, `.npmrc`, `AGENTS.md`, `PROGRESS.md`, `docs/DECISIONS.md`, `docs/DESIGN.md` (каркас).
- Next.js 16.4.5 + Tailwind 4 + shadcn; базовые зависимости.
- 3 проектных skill.
- `scripts/verify-build.sh`, `scripts/check-secrets.mjs`.
- Первый коммит, baseline `lint/typecheck/build`.

### Stage 1. База

- `supabase/migrations/0001_init.sql`: таблицы, индексы, `updated_at`, триггеры истории/циклов/лимита вложений/пинов, RLS, `is_admin()`, Storage bucket.
- `supabase/seed.sql` (статусы + демо), `seed.dev.sql` (2 тестовых клиента), `cleanup.dev.sql`.
- Тема, шрифты, layout, `/api/health`.
- `PROGRESS.md`; гейт: пользователь применяет SQL, агент проверяет health.

### Stage 2. Лендинг и вход

- `DESIGN.md` по референсу; `logo.svg`, `logo-dark.svg`.
- Лендинг: CSS-изометрия, glass/neon, фичи, CTA, дисклеймер.
- Supabase Auth `/login`, защита `/admin` через `proxy.ts`.
- Клиенты: создание, инвайт, отзыв, перевыпуск; `/invite`.
- Темы dark/light.

### Stage 3a. Админка и канбан

- `/admin`: доска, список, фильтры, поиск, DnD, оптимистичное обновление.
- CRUD задач, приоритеты, дедлайны, связи parent/child, дерево.
- Атомарный `change_task_status` RPC + история + уведомление.

### Stage 3b. Файлы и уведомления

- `/api/attachments` POST/DELETE: валидация, лимиты, signed URL, cleanup.
- Колокольчик, polling 30s, «прочитать все».
- Аудит-лог.
- Гейт Stage 3.

### Stage 4a. Пины

- `ImagePinComment`: клик/тап, координаты в %, маркер, модалка, список, ресайз, клавиатура, тач.
- Связь маркер ↔ комментарий.
- Unit-тесты геометрии.

### Stage 4b. Клиент и демо

- `/client`, `/client/projects/[id]`, `/client/tasks/[id]`.
- Разрешённые переходы статусов + уведомления.
- `/demo`, `/demo/projects/[id]`, `/demo/tasks/[id]`, seed, read-only, баннер.
- Гейт Stage 4.

### Stage 5. Деплой

- `vercel.json` cron `0 6 * * *` (09:00 МСК), `CRON_SECRET`.
- README, Mermaid, DNS-инструкция, финальный seed, `PROGRESS.md` 100%.
- Проверка live `/demo`, `/api/health`; гейт.

---

## 9. Что нужно от тебя сейчас

1. Подтвердить набор плагинов: **cc-safety-net + dsh-pilot** (рекомендую) и, по желанию, **dsh-context**.
2. Выполнить в терминале:

```bash
npx -y cc-safety-net@2.7.4 install --deepseek-harness
npx cc-safety-net doctor

dsh plugin --profile web add dsh-pilot@0.1.1
# опционально:
dsh plugin --profile web add dsh-context@0.82.1
```

3. Перезапустить `dsh web` (сессия сохранится) и открыть её снова.
4. Сказать «Начинаем Stage 0» — я скопирую входные документы, создам каркас, `AGENTS.md`, skills и baseline.

Если хочешь сначала обсудить архитектуру/дизайн — это нормально; до Stage 1 ничего не пишется в Supabase и не трогает твои аккаунты.

---

## Приложение A. Чек-лист безопасности на гейтах

- [ ] `.env.local` не в git; `.env.example` без значений.
- [ ] `git log --all -- .env.local` пуст.
- [ ] `grep -R "SUPABASE_SERVICE_ROLE_KEY"` только в `server-only` модулях/route handlers.
- [ ] `grep -R "CLIENT_SESSION_SECRET\|CRON_SECRET"` только server-side.
- [ ] `.next` бандл не содержит `service_role`, `CLIENT_SESSION_SECRET`, `CRON_SECRET`.
- [ ] Cookie `client_session`: HttpOnly, Secure (prod), SameSite=Lax.
- [ ] `/admin` без сессии → `/login`; `/client` без сессии → страница «ссылка истекла».
- [ ] Клиент A не видит данные B (dev-инвайты, два cookie-jar).
- [ ] Демо не видит реальные данные; мутации недоступны.
- [ ] Загрузка > лимита, SVG/GIF, подмена MIME — отклоняются.
- [ ] `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` присутствуют.
- [ ] Rate limit на `/invite` и `/api/attachments`.

## Приложение B. Команды проекта

```bash
npm run dev        # только пользователь, в его терминале
npm run lint       # eslint .
npm run typecheck  # tsc --noEmit
npm run test       # vitest run
npm run build      # next build (в чистой копии — verify-build.sh)
npm run verify     # lint + typecheck + test
```

## Приложение C. Источники по версиям

- Next.js 16: `proxy.ts` вместо `middleware.ts`, асинхронные `cookies()/params`, удалён `next lint` — <https://nextjs.org/docs/app/getting-started/proxy>, <https://nextjs.org/docs/app/guides/upgrading/version-16>.
- `cc-safety-net` для DSH — <https://ccsafetynet.com/docs/installation/deepseek-harness>.
- `dsh-pilot` — <https://github.com/Viger1/dsh-pilot>.
- `dsh-context` — <https://github.com/bowenliang123/dsh-context>.
