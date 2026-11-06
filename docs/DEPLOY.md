# Деплой Neyroflow

## 1. Что должно быть готово

- Supabase: миграция `supabase/migrations/0001_init.sql` применена, bucket
  `attachments` создан.
- Production seed: `supabase/seed.sql` (6 статусов + демо-данные).
- Админ создан в Supabase Auth; публичная регистрация выключена.
- Локально `npm run verify` и `npm run verify:build` — зелёные.
- Домен `neyrocontent.ru` доступен в Reg.ru (или замените на свой).

## 2. Vercel: проект

1. Запушить репозиторий на GitHub (без `.env.local`; он в `.gitignore`).
2. Vercel → **Add New → Project** → импортировать репозиторий.
3. Framework Preset: **Next.js**. Root Directory: корень репозитория.
4. Node.js: **22.x**.
5. Build Command / Output: оставить по умолчанию (`next build`).

## 3. Vercel: Environment Variables

Добавить для **Production** (и при необходимости Preview):

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project-ref>.supabase.co` — без `/rest/v1/` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role; только server-side |
| `CLIENT_SESSION_SECRET` | случайная строка ≥ 32 символов |
| `NEXT_PUBLIC_SITE_URL` | `https://neyrocontent.ru` |
| `CRON_SECRET` | случайная строка ≥ 32 символов |

Сгенерировать секреты:

```bash
openssl rand -base64 32
```

Не отправляйте значения в чат и не коммитьте. После изменения env — Redeploy.

## 4. Cron

`vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/deadlines", "schedule": "0 6 * * *" }
  ]
}
```

- `0 6 * * *` — UTC; это **09:00 МСК**.
- Vercel автоматически отправляет `Authorization: Bearer $CRON_SECRET`.
- Route проверяет заголовок и возвращает 401 без секрета.
- Дедлайны: задачи со сроком «завтра», кроме `done`; уведомления админу и
  клиенту; `dedupe_key` не даёт дублировать одно и то же за день.
- Проверить, что тариф Vercel поддерживает daily cron.

Ручная проверка (подставьте свой секрет локально, не в чат):

```bash
curl -i -H "Authorization: Bearer $CRON_SECRET" \
  https://neyrocontent.ru/api/cron/deadlines
```

Ожидаемо: `200` и JSON `{ ok: true, date, tasks, notifications }`.

## 5. Supabase Auth

Authentication → URL Configuration:

- Site URL: `https://neyrocontent.ru`
- Redirect URLs: `https://neyrocontent.ru/**`
- Для preview: добавьте `https://*.vercel.app/**` при необходимости.

Проверить: вход админа на `/login`; инвайт клиента на `/invite`.

## 6. Домен в Reg.ru

1. Vercel → Project → **Settings → Domains** → Add:
   - `neyrocontent.ru`
   - `www.neyrocontent.ru`
2. Vercel покажет точные записи. Обычно:

   | Тип | Имя | Значение | TTL |
   |---|---|---|---|
   | A | `@` | `76.76.21.21` | 3600 |
   | CNAME | `www` | `cname.vercel-dns.com` | 3600 |

   **Значения брать из Vercel**, они могут отличаться.
3. Reg.ru → Домены → DNS-серверы и зоны:
   - удалить старые/конфликтующие A и CNAME для `@` и `www`;
   - добавить записи выше;
   - сохранить.
4. Дождаться статуса Valid в Vercel (до 24–48 ч).
5. Fallback: `https://neyrocontent.vercel.app`.

## 7. Post-deploy smoke test

- [ ] `/` открывается, CSS-3D hero не ломается.
- [ ] `/demo` — два проекта, 12 задач, пины, read-only.
- [ ] `/login` — вход админа.
- [ ] `/admin` — доска, фильтры, создание задачи.
- [ ] `/invite?token=...` — вход клиента; чужая задача → 404.
- [ ] `/api/health` — `ok: true`, `db: true`, `storage: true`.
- [ ] `/api/cron/deadlines` с Bearer — 200; без Bearer — 401.
- [ ] Файл: загрузка/скачивание/удаление; SVG/GIF отклоняются.
- [ ] Пин на изображении; ресайз 360/1440.
- [ ] Колокольчик: событие → badge → «Прочитать все».
- [ ] Светлая/тёмная темы; консоль без ошибок.
- [ ] PII-дисклеймер в футере и README.

## 8. Откат

- Vercel → Deployments → предыдущий deployment → **Promote to Production**.
- Миграции не откатывать автоматически; схема совместима с предыдущим
  фронтендом в рамках MVP.

## 9. Частые проблемы

| Симптом | Причина / решение |
|---|---|
| `PGRST125 Invalid path` | В `NEXT_PUBLIC_SUPABASE_URL` есть `/rest/v1/`; убрать |
| `keyFormat` неверный | В service key лежит publishable/anon; взять service_role |
| Клиент видит пустой портал | Неверный `client_session`/`session_version`; перевыпустить инвайт |
| Файлы не грузятся | Нет bucket `attachments`; выполнить миграцию |
| Cron 401 | `CRON_SECRET` не задан или не совпадает |
| Домен не валидируется | Конфликтующие DNS-записи; оставить только записи Vercel |
| Сборка на Vercel падает | Проверить env; `NEXT_PUBLIC_*` нужны на build |

## 10. Передача проекта

Репозиторий + Vercel + Supabase + домен. Новый владелец:

1. Создаёт Supabase Auth-пользователя.
2. Заполняет env в Vercel.
3. Ротирует `SUPABASE_SERVICE_ROLE_KEY`, `CLIENT_SESSION_SECRET`,
   `CRON_SECRET`; старые сессии инвалидируются.
4. Удаляет старого админа.
