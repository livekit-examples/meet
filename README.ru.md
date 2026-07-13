<a href="https://livekit.io/">
  <img src="./.github/assets/livekit-mark.png" alt="Логотип LiveKit" width="100" height="100">
</a>

# LiveKit Meet

**Документация:** [English](./README.md) | Русский

Веб-приложение для видеоконференций на Next.js и LiveKit. Это доработанный форк
[LiveKit Meet](https://github.com/livekit/meet) с синхронным кинотеатром,
push-to-talk, E2EE, записью комнат и настройками медиа.

![Скриншот LiveKit Meet](./.github/assets/livekit-meet.jpg)

## Что нужно для запуска

- **Node.js 18 или новее**. В CI используется Node 24.
- Доступ к **LiveKit Cloud** или собственному LiveKit Server.
- Три значения от LiveKit: `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` и
  `LIVEKIT_URL`.
- Браузер с доступом к камере и микрофону. Для YouTube и глобального push-to-talk
  рекомендуется Chrome или Edge.

Без LiveKit credentials главная страница запустится, но вкладка **Demo** не сможет
выдать токен и подключить участника к комнате.

## Быстрый запуск

### 1. Установите зависимости

Из корня репозитория выполните:

```bash
corepack pnpm install
```

В `package.json` зафиксирован `pnpm@10.18.2`, поэтому Corepack сам использует нужную
версию. Если команда `pnpm` уже доступна, можно выполнить обычный `pnpm install`.

### 2. Создайте `.env.local`

macOS, Linux или WSL:

```bash
cp .env.example .env.local
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Файл `.env.local` уже исключён из Git. Не коммитьте API secret.

### 3. Добавьте LiveKit credentials

Создайте проект в [LiveKit Cloud](https://cloud.livekit.io/) и возьмите URL, API key
и API secret из настроек проекта. Для собственного LiveKit Server используйте его
URL и настроенные на сервере ключи.

Заполните `.env.local`:

```dotenv
LIVEKIT_API_KEY=ваш-api-key
LIVEKIT_API_SECRET=ваш-api-secret
LIVEKIT_URL=wss://ваш-проект.livekit.cloud
```

Важно:

- `LIVEKIT_URL` должен быть WebSocket-адресом с `wss://` или `ws://`, а не адресом
  панели управления с `https://`.
- `LIVEKIT_API_SECRET` используется только серверной частью Next.js. Никогда не
  добавляйте к нему префикс `NEXT_PUBLIC_`.
- После изменения `.env.local` перезапустите dev-сервер.

### 4. Запустите приложение

```bash
corepack pnpm dev
```

Откройте [http://localhost:3000](http://localhost:3000).

### 5. Проверьте комнату

1. Откройте вкладку **Demo**.
2. Нажмите **Start Meeting**.
3. Введите имя, выберите камеру и микрофон, затем подключитесь.
4. Скопируйте адрес созданной комнаты и откройте его в режиме инкогнито или другом
   профиле браузера, чтобы проверить второго участника.
5. Разрешите браузеру доступ к камере и микрофону.

После этого приложение готово к локальной разработке.

## Режимы подключения

### Demo

Приложение само запрашивает JWT через `/api/connection-details`. Для этого режима
обязательны три серверные переменные LiveKit из `.env.local`.

### Custom

На вкладке **Custom** пользователь вручную вводит `wss://` URL сервера и готовый
participant token. Этот режим не запрашивает токен через локальный API, но токен всё
равно должен быть заранее создан доверенным сервером.

## Основные команды

| Команда                      | Назначение                             |
| ---------------------------- | -------------------------------------- |
| `corepack pnpm dev`          | Запустить dev-сервер на порту 3000.    |
| `corepack pnpm build`        | Собрать production-версию.             |
| `corepack pnpm start`        | Запустить собранную production-версию. |
| `corepack pnpm lint`         | Проверить ESLint.                      |
| `corepack pnpm test`         | Запустить тесты Vitest.                |
| `corepack pnpm format:check` | Проверить форматирование Prettier.     |
| `corepack pnpm format:write` | Исправить форматирование файлов.       |

Если глобальный `pnpm` установлен, префикс `corepack` можно опустить.

## Переменные окружения

### Обязательные

| Переменная           | Назначение                                                     |
| -------------------- | -------------------------------------------------------------- |
| `LIVEKIT_API_KEY`    | Серверный API key для выпуска participant token.               |
| `LIVEKIT_API_SECRET` | Серверный API secret. Не передаётся в браузер.                 |
| `LIVEKIT_URL`        | WebSocket URL LiveKit, например `wss://project.livekit.cloud`. |

### Опциональные

| Переменная                            | Назначение                                                           |
| ------------------------------------- | -------------------------------------------------------------------- |
| `NEXT_PUBLIC_SHOW_SETTINGS_MENU=true` | Показать настройки устройств, фона, Krisp и записи.                  |
| `NEXT_PUBLIC_LK_RECORD_ENDPOINT`      | Endpoint записи, обычно `/api/record`.                               |
| `NEXT_PUBLIC_CONN_DETAILS_ENDPOINT`   | Другой endpoint выдачи токена. По умолчанию локальный API.           |
| `NEXT_PUBLIC_PTT_WS_URL`              | WebSocket локального PTT helper. По умолчанию `ws://127.0.0.1:7331`. |
| `NEXT_PUBLIC_DATADOG_CLIENT_TOKEN`    | Client token Datadog. Нужен вместе с `NEXT_PUBLIC_DATADOG_SITE`.     |
| `NEXT_PUBLIC_DATADOG_SITE`            | Site Datadog.                                                        |

Для записи также нужны `S3_KEY_ID`, `S3_KEY_SECRET`, `S3_ENDPOINT`, `S3_BUCKET` и
`S3_REGION`. Публичные переменные `NEXT_PUBLIC_*` встраиваются во время сборки,
поэтому задавайте их до `pnpm build`.

## Кинотеатр

После входа в комнату нажмите **Кинотеатр** в левом верхнем углу.

- **Ссылка или YouTube:** вставьте прямую ссылку на MP4/WebM/Ogg, HLS playlist
  (`.m3u8`) или YouTube. Воспроизведение, пауза и позиция синхронизируются через
  LiveKit data channel.
- **Локальный файл:** файл остаётся на компьютере ведущего. Браузер захватывает его
  как media stream и публикует через LiveKit как screen share.

Прямой источник должен разрешать CORS и воспроизводиться браузером. YouTube в этом
приложении надёжнее работает в Chromium-браузерах из-за ограничений COEP и iframe.

## Глобальный push-to-talk

Веб-страница не видит нажатия клавиш, когда фокус находится в игре или другом
приложении. Для глобальной кнопки разговора используется отдельный Windows helper:

```powershell
cd companion
npm install
npm run learn
$env:PTT_KEY="F8"; npm start
```

После подключения helper микрофон работает в режиме рации: удержание выбранной
клавиши включает микрофон, отпускание выключает. Подробности находятся в
[`companion/README.md`](./companion/README.md).

Чтобы полностью отключить попытку подключения к helper, добавьте в `.env.local`:

```dotenv
NEXT_PUBLIC_PTT_WS_URL=
```

## Запись комнаты

Запись использует LiveKit Egress и S3. Минимально нужно добавить S3-переменные и:

```dotenv
NEXT_PUBLIC_SHOW_SETTINGS_MENU=true
NEXT_PUBLIC_LK_RECORD_ENDPOINT=/api/record
```

Затем используйте **Settings -> Recording** в комнате. E2EE-комнаты записывать
нельзя: серверный Egress не может расшифровать их медиапотоки.

Маршруты `/api/record/*` и `/api/connection-details` не имеют авторизации. Это
демонстрационная конфигурация; перед публичным развёртыванием обязательно добавьте
аутентификацию и проверку прав.

## Production-запуск

```bash
corepack pnpm build
corepack pnpm start
```

По умолчанию приложение откроется на `http://localhost:3000`. На сервере или в
Vercel задайте те же переменные окружения в настройках окружения, а не только в
локальном `.env.local`.

## Частые проблемы

### `pnpm: command not found`

Используйте команды через Corepack: `corepack pnpm install`, `corepack pnpm dev` и
так далее. Если не найден и `corepack`, установите актуальную LTS-версию Node.js.

### `LIVEKIT_URL is not defined`

Не создан `.env.local`, переменная осталась пустой или dev-сервер не был перезапущен
после изменения файла.

### Комната открылась, но подключение не происходит

Проверьте, что URL начинается с `wss://`, API key и secret относятся к тому же
LiveKit-проекту, а браузер или firewall не блокирует WebSocket/WebRTC.

### Нет камеры или микрофона

Разрешите доступ для `localhost` в браузере и убедитесь, что устройство не занято
другим приложением. Камера и микрофон требуют secure context; `localhost` считается
безопасным для локальной разработки.

### Видео по ссылке не запускается

Проверьте формат, CORS и доступность URL непосредственно в браузере. Для HLS источник
должен разрешать загрузку playlist и сегментов с origin приложения.

## Дополнительная документация

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — архитектура, маршруты и жизненный цикл
  подключения.
- [`CLAUDE.md`](./CLAUDE.md) — команды и правила для разработчиков.
- [`companion/README.md`](./companion/README.md) — настройка глобального PTT helper.

## Лицензия

[Apache-2.0](./LICENSE)
