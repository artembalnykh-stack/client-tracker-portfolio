---
name: supabase-rls-review
description: Ревью Supabase SQL для Neyroflow — RLS, гранты, политики, триггеры, Storage и фильтрация client_id. Использовать перед применением миграции пользователем.
whenToUse: Перед или после написания supabase/migrations/*.sql, seed, инвайтов, вложений и любых запросов с service_role.
---

# Supabase RLS review

Проверяй миграцию как ревьюер, а не как автор. Цель — не пропустить утечку
данных клиента A клиенту B и не сломать применение SQL в SQL Editor.

## Чек-лист

1. **Транзакция.** `begin; ... commit;` вокруг всей миграции; при ошибке
   ничего не применяется частично.
2. **Таблицы.** Все таблицы из `docs/TS.md` + `clients.is_demo`; UUID
   `gen_random_uuid()`; `created_at`, `updated_at`, индексы
   `(project_id, status_code, position)`, `(deadline)`, `(priority)`.
3. **RLS.** `alter table ... enable row level security` на каждой таблице.
   `revoke all on ... from anon`; `authenticated` получает только нужные
   grant-ы. Политики админа — `is_admin()`.
4. **`is_admin()`.** `security definer`, `stable`, `set search_path = public`;
   проверяет `profiles.id = auth.uid()` и `role = 'admin'`; execute только
   `authenticated`.
5. **Anon.** Никаких политик для `anon` на клиентские и демо-данные. Клиент и
   демо идут через сервер.
6. **Storage.** Bucket `attachments` приватный, лимит 2 МБ, разрешённые MIME;
   публичных политик на `storage.objects` нет.
7. **Триггеры.**
   - `updated_at` на таблицах с этим полем;
   - история статусов (`from_status`, `to_status`, actor);
   - запрет циклов в `task_relations` (рекурсивный CTE);
   - лимит 4 вложения на task и 4 на comment;
   - очистка пина при удалении вложения (все три поля);
   - валидация, что пин относится к изображению этой же задачи.
8. **`service_role`.** Только server-only модуль. Проверь, что клиентские
   запросы не используют его в браузере.
9. **Клиентские выборки.** Каждая функция принимает `clientId` и фильтрует
   через `projects.client_id`; нет запроса «по task_id без join к projects».
10. **Демо.** Все выборки `is_demo = true`; админские — `is_demo = false`.
11. **Аудит.** `audit_logs` append-only: нет политик update/delete.
12. **Сиды.** Статусы ровно 6, цвета и порядок из ТЗ; демо-данные вымышленные;
    dev-инвайты только в `seed.dev.sql`.

## Красные флаги

- `using (true)` или `with check (true)` для `anon`/`authenticated`.
- Политика `for all` без `to authenticated`.
- `security definer` без `search_path`.
- `service_role` в клиентском компоненте или в `NEXT_PUBLIC_*`.
- `select * from tasks where id = $1` без проверки проекта клиента.
- `on delete set null` на `pinned_attachment_id` без триггера.
- Bucket public или политика `storage.objects` для `anon`.

## Формат ответа

```
Blockers:
- [файл:строка] проблема → как исправить

Warnings:
- ...

Nitpicks:
- ...
```

Не переписывай всю миграцию, если можно дать точечные патчи.
