# AI Code Review Helper

AI-ревьюер pull request'ов для junior-разработчиков. Подключается как GitHub App
к репозиторию, на каждый новый/обновлённый PR тянет diff, прогоняет его через
Claude (Anthropic API) с промптом «объясни, почему так лучше — а не просто
перечисли ошибки», публикует комментарии прямо в PR и сохраняет историю ревью
в дашборде.

## Архитектура

```
GitHub PR opened/synchronize
        │  (webhook, HMAC-signed)
        ▼
Express backend (Node/TS, ESM)
        │
        ├── fetchPullRequestDiff()      GitHub API: список файлов + патчи
        ├── distillDiffForReview()      фильтрует lock/min-файлы, режет гигантские патчи
        ├── generateReviewComments()    Anthropic API → структурированный JSON
        ├── postReviewComments()        публикует review-комментарии в PR
        └── saveReview()                PostgreSQL (Drizzle ORM) — история

React/TS дашборд (Vite) ── GitHub OAuth ── читает историю через /api/reviews
```

Backend и frontend — отдельные npm-проекты (`/` и `/frontend`), общаются
по HTTP; в dev-режиме Vite проксирует `/api` и `/auth` на backend, так что
браузер видит один origin и никакой возни с CORS.

## Стек и почему так

- **Express + TypeScript, ESM.** Начинали с CommonJS, но современные
  Octokit-пакеты (v20+) — чистый ESM и не грузятся через `require`.
  Мигрировали на `"type": "module"` + `moduleResolution: "NodeNext"`
  вместо того, чтобы откатывать зависимости на устаревшие версии.
- **Drizzle ORM, а не Prisma.** Изначально планировался Prisma, но его
  CLI качает бинарные query/schema-движки с отдельного CDN — в моём
  окружении разработки этот домен был недоступен. Drizzle работает через
  обычный `pg`-драйвер без бинарных зависимостей — ничего не потерял в
  функциональности, зато проще деплоить.
- **Anthropic API напрямую через `fetch`**, без SDK — меньше зависимостей,
  прозрачнее видно, что происходит в промпте.
- **@octokit/webhooks** для верификации HMAC-подписи вебхуков — не писал
  проверку подписи руками, это ровно тот код, где самодеятельность опасна.

## Быстрый старт (локально, без Docker)

```bash
# 1. backend
npm install
cp .env.example .env      # заполнить GitHub App / Anthropic ключи, см. ниже
npm run db:generate       # сгенерировать SQL-миграцию из schema.ts
npm run db:migrate        # применить к PostgreSQL (нужен запущенный Postgres)
npm run dev                # http://localhost:3000

# 2. frontend (в отдельном терминале)
cd frontend
npm install
npm run dev                # http://localhost:5173
```

## Через Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

Поднимет backend + PostgreSQL. Фронтенд пока не завёрнут в отдельный
compose-сервис — для портфолио-демо достаточно `npm run dev` в `frontend/`.

> Dockerfile и docker-compose.yml написаны по стандартной практике
> (multi-stage build, healthcheck на Postgres), но в моей рабочей
> среде не было доступа к Docker daemon, поэтому живой `docker build`
> я не прогонял — если что-то не так с путями, дайте знать.

## Переменные окружения

См. `.env.example`. Коротко:

| Переменная                                                                                                             | Что это                                                                                                                                                                         |
| ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_APP_CLIENT_ID`, `GITHUB_APP_CLIENT_SECRET`, `GITHUB_WEBHOOK_SECRET` | Создаются на [github.com/settings/apps/new](https://github.com/settings/apps/new). Нужны permissions: Pull requests (read/write), Contents (read); webhook events: Pull request |
| `ANTHROPIC_API_KEY`                                                                                                    | [console.anthropic.com](https://console.anthropic.com) → API Keys                                                                                                               |
| `DATABASE_URL`                                                                                                         | строка подключения к PostgreSQL                                                                                                                                                 |
| `SESSION_SECRET`                                                                                                       | любая случайная строка — подписывает JWT в session-cookie                                                                                                                       |

## Тесты

```bash
npm test          # backend: vitest — health, webhook HMAC-подпись, парсинг AI-ответа, фильтрация diff
cd frontend && npm run build   # frontend: typecheck + prod-сборка
```

12 тестов, все зелёные. Часть логики (webhook-подпись, парсинг ответа модели,
фильтрация diff) протестирована как чистые функции без сети; слой БД и API
дополнительно проверялся вручную против реального локального PostgreSQL —
см. историю коммитов, там честно описано, что и как проверялось на каждом
этапе.

## Известные ограничения / что дальше

- Нет rate-limiting на вебхуки и AI-запросы — для реального трафика нужен.
- `postReviewComments` публикует один review за раз; для очень больших PR
  (100+ комментариев) GitHub API может резать запрос — стоит батчить.
- Дашборд не обновляется в реальном времени (нет WebSocket/polling) —
  для MVP достаточно перезагрузки страницы.
- CI (`.github/workflows/ci.yml`) не запускался вживую на GitHub — прогнан
  локально в точности теми же командами, но реальный workflow-run стоит
  проверить после первого push.
