---
name: release-security
description: Финальная проверка безопасности Neyroflow перед коммитом/деплоем — секреты, бандл, cookie, RLS, изоляция клиентов и демо. Использовать на гейтах и перед push.
whenToUse: Перед коммитом этапа, перед push, перед деплоем на Vercel и при подозрении на утечку секрета.
---

# Release security

## Команды

```bash
npm run verify
npm run verify:build
git status --short
git log --all --oneline -- .env.local
node scripts/check-secrets.mjs
```

## Чек-лист

1. **Секреты.** `.env.local` не в git; `.env.example` без значений; в
   `package.json` нет токенов; в `docs/` нет реальных ключей.
2. **Server-only.** `SUPABASE_SERVICE_ROLE_KEY`, `CLIENT_SESSION_SECRET`,
   `CRON_SECRET` встречаются только в server-only модулях и route handlers.
3. **Бандл.** В `.next/static` нет `service_role`, `CLIENT_SESSION_SECRET`,
   `CRON_SECRET`, JWT-ключей.
4. **Cookie.** `client_session`: HttpOnly, Secure в проде, SameSite=Lax,
   ограниченный срок; `session_version` проверяется.
5. **RLS.** Включён на всех таблицах; `anon` без доступа; админ — через
   `is_admin()`; Storage приватный.
6. **Изоляция.** Клиент A не видит проекты/задачи B; проверка через два
   dev-инвайта и два cookie-jar.
7. **Демо.** Только `is_demo = true`; мутации недоступны; реальные данные не
   попадают.
8. **Файлы.** Лимиты 500 КБ/2 МБ, 4 на задачу/комментарий; SVG/GIF
   отклоняются; MIME + magic bytes + размер; signed URL 1 час.
9. **CSRF/rate limit.** Origin-check на route handlers; лимит на `/invite` и
   `/api/attachments`.
10. **Headers.** `X-Content-Type-Options`, `Referrer-Policy`,
    `X-Frame-Options: DENY`.
11. **ПДн.** Дисклеймер дословно в README и футере; сиды вымышленные.
12. **Аудит.** Append-only; нет update/delete политик.

## Красные флаги

- `NEXT_PUBLIC_` с service role или секретом.
- `import` admin-клиента в `"use client"` файле.
- Запрос клиента без `clientId`.
- `select *` из `tasks` по `id` без join к `projects`.
- Публичный bucket или политика `storage.objects` для `anon`.
- `dangerouslySetInnerHTML` с пользовательским текстом.
- `git push --force`, `vercel --prod` без явного разрешения пользователя.

## Формат

```
Blockers: ...
Warnings: ...
Проверено: ...
```
