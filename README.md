# SideWire

SideWire adds shared team communication to the web tools a team already uses. Its web application and Chrome side panel share the same collaboration data; optional page context brings the relevant Chat beside external work.

The repository is named `PageRelay`; SideWire is the product name. Its feature-review proposals are not claims that every described capability has shipped.

## Documentation and agents

Start with [AGENTS.md](AGENTS.md) and [docs/INDEX.md](docs/INDEX.md). Read only the relevant product, architecture, UI, feature, and scoped agent guidance before changing code.

[The feature index](docs/features/README.md) separates documented baseline behavior from proposed communication features. [The plan register](docs/plans/README.md) owns open work, approval, and closure. Living plans are in `docs/plans/active/`; verified finished plans belong in `docs/plans/completed/`. Existing plans 000-003 still record verification gaps.

[WORKFLOW](docs/engineering/WORKFLOW.md) owns the engineering/verification loop and [QUALITY](docs/QUALITY.md) maps recorded evidence. Root `PLANS.md` remains a stable pointer to the canonical planning standard.

Use Chat and Activity in the interface. Existing internal `Conversation` terminology remains valid. Do not introduce a rename-only migration or another product's assumptions.

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

## Initialize the first owner

Public company registration is controlled by `REGISTRATION_ENABLED`, which defaults to `false` when unset. With it disabled, invited people can still create an account through a valid Organization invitation. Set `REGISTRATION_ENABLED=true` to allow public signup; it creates an unverified owner, their Organization and the Main default Workspace. Rebuild Laravel’s configuration cache (`php artisan config:cache`) after changing the flag; build the updated web assets once with `npm run build:web` when installing this change. Subsequent flag changes do not require another frontend build. After applying migrations, run this command from the deployed application directory to initialize an installation with no users or Organizations:

```bash
php artisan sidewire:bootstrap owner@example.com --name="Owner Name" --organization="Company Name"
```

Enter and confirm the password at the hidden prompts. The command creates a verified owner, one Organization, and its Main default Workspace. It accepts at least eight password characters for trusted initial provisioning; production web password/reset validation retains its existing stronger policy. It refuses to overwrite or add accounts when users or Organizations already exist. Concurrent bootstrap commands must use the same configured cache lock store. Internal operator access remains the separate `sidewire:admin` command.

For local development, prefix the Artisan command with `./vendor/bin/sail`. Deploy through the normal configuration/route cache rebuild before using the command. Invitation links let new recipients create an account in the inviting Organization; existing recipients log in and accept eligible invitations. Invitation signup never creates another company. Public signup is available only with the flag enabled, and email verification remains required for either signup flow.

## Email with Resend

The Resend PHP SDK is installed and uses Laravel's existing mail transport.
Set `MAIL_MAILER=resend`, `RESEND_API_KEY`, `MAIL_FROM_ADDRESS` (a verified
Resend sender), and `MAIL_FROM_NAME` in the application environment. Rebuild
cached configuration with `php artisan config:cache` if your deployment uses
it, and restart long-running queue workers after changing mail configuration.
Local development defaults to the log mailer; `.env.example` contains no API key.

## Load the Chrome extension

In Chrome, open `chrome://extensions`, enable Developer mode, choose **Load
unpacked**, and select `apps/extension/dist`. Vite rebuilds that directory when
extension source files change. Reload the unpacked extension from Chrome after
a rebuild to run the new service worker and side-panel bundle.

The extension can be built once with
`./vendor/bin/sail npm run build:extension`.

The development manifest can connect only to `http://localhost:8000`. Its
`tabs` permission lets the open side panel read the active tab's URL, title,
and favicon as the user moves between work pages. It does not use a content
script or broad website host permissions.

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

Run the application checks through Sail:

```bash
./vendor/bin/sail composer validate --strict
./vendor/bin/sail composer test
./vendor/bin/sail npm run foundation:check
./vendor/bin/sail npm run check
./vendor/bin/sail npm run types:check
./vendor/bin/sail npm run build
```

Documentation-only checks do not require application dependencies:

```bash
node --test scripts/check-docs.test.mjs
node scripts/check-docs.mjs
git diff --check
```

Use the repository Node runtime, directly or through Sail. The documentation
workflow runs these Node checks separately from application CI. Structural
success does not establish browser behavior, security, or release readiness.
