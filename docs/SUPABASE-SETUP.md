# Supabase: применение схемы

**Кому:** пользователю. Агент не читает `.env.local` и не получает ключи.

## 1. Применить миграцию

1. Открой проект на supabase.com → **SQL Editor** → **New query**.
2. Вставь содержимое `supabase/migrations/0001_init.sql` → **Run**.
3. Ожидаемо: `Success. No rows returned`.

Если ошибка — пришли только текст ошибки (без ключей и URL с паролем).

## 2. Применить seed

1. Новый запрос → содержимое `supabase/seed.sql` → **Run**.
2. Проверь:

```sql
select code, name, sort_order from public.statuses order by sort_order;
select count(*) from public.projects where is_demo; -- 2
select count(*) from public.tasks t
  join public.projects p on p.id = t.project_id
  where p.is_demo; -- 12
```

## 3. (Только dev) тестовые клиенты

1. Новый запрос → `supabase/seed.dev.sql` → **Run**.
2. Ссылки для проверки клиентского портала появятся в Stage 2:
   `/invite?token=dev-client-a-token` и `...b-token`.
3. Перед продом удали: `supabase/cleanup.dev.sql`.

## 4. Auth

1. **Authentication → Providers → Email**: включён.
2. **Allow new users to sign up** — **выключить**.
3. **Authentication → Users → Add user**: email + пароль админа.
   Пароль агенту не сообщай.
4. Профиль создастся триггером `on_auth_user_created`.

## 5. Переменные окружения

**Project Settings → API**:

- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (только сервер)

Создай `.env.local` из `.env.example` (файл не коммитится, права `600`):

```bash
cp .env.example .env.local
chmod 600 .env.local
openssl rand -base64 32   # CLIENT_SESSION_SECRET
openssl rand -base64 32   # CRON_SECRET
```

`NEXT_PUBLIC_SITE_URL=http://localhost:3000` для локалки.

## 6. Проверка

```bash
npm run dev
```

В другом терминале:

```bash
curl -s http://localhost:3000/api/health
# в dev дополнительно будут keyFormat, projectRef, urlPath
# {"ok":true,"db":true,"storage":true,"statuses":6}
```

Если `ok:false`:

- `db:false` — миграция не применена или неверный URL/ключ;
- `storage:false` — bucket `attachments` не создан;
- `statuses` не 6 — не применён `seed.sql` или миграция прервалась.

В dev `/api/health` также отдаёт `keyFormat`, `projectRef`, `urlPath` и
`dbError`/`storageError`. В production этих полей нет.

## 7. Ошибки

- **`PGRST125 Invalid path specified in request URL`** — в
  `NEXT_PUBLIC_SUPABASE_URL` указан REST-эндпоинт (`.../rest/v1/`). Нужен
  **Project URL** без пути: `https://<ref>.supabase.co`. В health `urlPath`
  должен быть `/`, а не `/rest/v1/`.
- **`keyFormat: "sb_publishable"`** — в `SUPABASE_SERVICE_ROLE_KEY` лежит
  publishable/anon-ключ. Нужен secret key (`sb_secret_...`) или legacy
  `service_role`. С `anon` health покажет `statuses:0`, `storage:false`.
- **`relation "..." does not exist`** — миграция не применена или применена
  частично; выполни `reset.sql` (только dev), затем миграцию снова.
- **`permission denied for table ...`** — проверь, что SQL Editor выполняет
  запрос от `postgres`, а не от `anon`.
- **`function auth.uid() does not exist`** — запрос выполняется не в Supabase,
  а в другой базе.
- **`duplicate key ... statuses_pkey`** — `seed.sql` уже применён; это нормально,
  он идемпотентен.

## 8. Сброс (только dev)

`supabase/reset.sql` удаляет все таблицы, функции, триггер и bucket.
После него заново: миграция → seed.
