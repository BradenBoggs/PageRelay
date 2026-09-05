# SideWire

SideWire is a Chrome side-panel collaboration product that adds shared team communication and lightweight task coordination to the web tools a team already uses.

The repository is named `PageRelay`; SideWire is the current product name. Treat PageRelay as a repository codename unless the product is renamed again.

Before implementing application code, read:

- `AGENTS.md`
- `docs/PRODUCT.md`
- `docs/ARCHITECTURE.md`
- `docs/UI.md` for interface work
- the relevant file under `docs/features/`
- the active plan under `docs/plans/`

Foundation implementation is tracked in `docs/plans/000-execplan.md`. The page-chat, Apps, and manual-linking revision is planned in `docs/plans/001-page-chats-and-linking.md`; that documentation update is not authorization to implement application changes.

Use Chat and Activity in the interface. Existing specification filenames and internal `Conversation` terminology remain valid. Product vocabulary and feature ownership are indexed in `docs/PRODUCT.md`.

## Local development with Sail

Use WSL 2 with Docker Desktop's WSL integration enabled. Git and Docker are the
only host tools required; Sail provides PHP 8.4, Node.js 24, PostgreSQL 18, and
Redis. Run every command below from the repository directory in WSL.

On the first checkout, install the PHP dependencies without relying on the
host's PHP version:

```bash
docker run --rm \
    -u "$(id -u):$(id -g)" \
    -v "$(pwd):/var/www/html" \
    -w /var/www/html \
    laravelsail/php84-composer:latest \
    composer install --ignore-platform-reqs
cp .env.example .env
```

Then bootstrap the application from its locked dependencies:

```bash
./vendor/bin/sail up -d
./vendor/bin/sail artisan key:generate
./vendor/bin/sail npm ci
./vendor/bin/sail artisan migrate --seed
./vendor/bin/sail npm run dev:all
```

Laravel is available at `http://localhost:8000`. The final command keeps the
web Vite server, extension build watcher, Horizon queue worker, and Reverb
WebSocket server in the foreground. Stop those processes with `Ctrl+C`; stop
the containers with `./vendor/bin/sail down`.

The internal Filament panel is at `http://localhost:8000/admin` and Horizon is
at `http://localhost:8000/horizon`. Filament always requires explicit SideWire
operator access; Horizon follows Laravel's local-development allowance and
uses the same operator flag outside local environments. Grant or revoke the
flag only for an existing account:

```bash
./vendor/bin/sail artisan sidewire:admin developer@example.com
./vendor/bin/sail artisan sidewire:admin developer@example.com --revoke
```

## Load the Chrome extension

In Chrome, open `chrome://extensions`, enable Developer mode, choose **Load
unpacked**, and select `apps/extension/dist`. Vite rebuilds that directory when
extension source files change. Reload the unpacked extension from Chrome after
a rebuild to run the new service worker and side-panel bundle.

The extension can be built once with
`./vendor/bin/sail npm run build:extension`.

The development manifest can connect only to `http://localhost:8000`. It does
not use a content script or broad website host permissions.

## shadcn MCP

The repository tracks a VS Code shadcn MCP server in `.vscode/mcp.json`. It
runs the locally locked shadcn CLI through Sail's Node.js 24 runtime.

Register the same server for Codex from this repository directory:

```bash
codex mcp add shadcn -- "$(pwd)/vendor/bin/sail" npx shadcn mcp
codex mcp get shadcn
```

Start a new Codex or VS Code session after changing MCP configuration so the
client reloads its server inventory.

## Verification

Run the repository checks through Sail:

```bash
./vendor/bin/sail composer validate --strict
./vendor/bin/sail composer test
./vendor/bin/sail npm run foundation:check
./vendor/bin/sail npm run check
./vendor/bin/sail npm run types:check
./vendor/bin/sail npm run build
```
