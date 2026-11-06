# Плагины DSH: установлено и проверено

**Дата:** 06.11.2026  
**DSH:** 0.2.1-rc.5, профиль `web`

## Установлено

| Плагин | Версия | Роль | Статус |
|---|---|---|---|
| `cc-safety-net` | 2.7.4 | Защита секретов и разрушительных команд | Detected / Configured / Verified, self-test 3/3 |
| `dsh-pilot` | 0.1.1 | Браузер для UI-проверок (`pilot_*`) | Localhost-навигация, snapshot и click проверены |
| `dsh-context` | 0.82.1 | Панель контекста и `/context` | Установлен; UI-вкладка появляется после обновления страницы |

## Отключено

- `@deepseek-ai/dsh-experimental-plugin-market-bundle` — строки `plugin-market` и `ui-plugin-market` переведены в `disabled: true`. Discover-вкладка и сервис кастомных маркетов больше не нужны.

## Конфигурация

`~/.dsh/profiles/web/cordis.patch.yml`:

```yaml
- id: plugin-market
  disabled: true
- id: ui-plugin-market
  disabled: true

- id: pilot
  config:
    headless: true
    allowedOrigins:
      - neyrocontent.ru
      - neyrocontent.vercel.app
    allowPasswordFields: false
    profileDir: ""
```

Модель остаётся `deepseek-flash`, `reasoningEffort: high`. MCP не подключены.

## Проверки

- `npx cc-safety-net doctor`: DeepSeek Harness — Detected / Configured / Verified; synthetic self-test 3/3.
- `cat .env.local` через bash — **заблокировано** (`secret.pattern.env-variant`).
- Запись `/tmp/.../.env.local` через файловый инструмент — **заблокировано** тем же правилом.
- `.env.example` — чтение и запись **разрешены**.
- `dsh-pilot`: страница на `127.0.0.1:3100` открыта, accessibility-снимок получен, кнопка нажата, результат изменился.

## Важно

- Агент теперь не может ни прочитать, ни создать `.env.local`. Это сделано специально: файл создаёшь и заполняешь только ты.
- Если вкладка Context или исчезновение Discover не видны сразу — обнови страницу GUI; если не помогло, перезапусти `dsh web`.
- `pnpm peers check` показывает отсутствие host-пакетов в профиле — это ожидаемо для DSH-плагинов, они резолвятся из харнеса; `dsh-pilot` и guard проверены в работе.

## Откат

```bash
npx cc-safety-net@2.7.4 uninstall --deepseek-harness
dsh plugin --profile web remove dsh-pilot dsh-context
```

После отката вернуть `cordis.patch.yml` к исходному виду (без блока `pilot` и disabled-строк маркета).
