# GPS pilot setup and acceptance

Status: implementation candidate; not deployed or certified for live GPS use. See [plan 005](../plans/active/005-gps-communication-pilot.md) for actual checks and limitations.

## Prepare an isolated pilot

Deploy the existing Laravel application with its supported PostgreSQL/Redis environment, HTTPS, migrations, queue worker and Reverb process. Use normal authenticated accounts and organization invitations; do not share an owner login or insert invented employee accounts. No billing bypass or commercial policy is added by this pilot.

Set the actual HTTPS app origin in `APP_URL` and `VITE_SIDEWIRE_APP_URL`; configure the existing Reverb variables consistently for server and browser, with TLS and approved origins. Build the web app and extension with `npm run build`. The extension build writes only that exact app origin to its manifest; development HTTP is allowed only for localhost/127.0.0.1. Install the built `apps/extension/dist` as an unpacked extension for this controlled pilot and reload after updates. Public Web Store distribution is a separate release.

Apply the additive collaboration migration through the normal deployment procedure. Back up first. Never use a production database for test suites or roll back the new tables to solve a UI error.

## Use the pilot

Open **Messages, DMs & mentions** in the web navigation, or **Messages & DMs** in the panel. Open **Direct messages**, choose **New direct message**, search for an active coworker and select them. Work Chats remain organization-wide; use a DM for private discussion. DMs never attach the current browser page.

In a message or reply, type `@` and select a suggested coworker. Only selected people shown in the mention chips are notification recipients; plain `@name` text alone does not notify. Choose **Reply in thread** on a root message. The root author and previous reply authors receive new thread activity. Reading a main Chat does not clear unseen reply attention.

Open **Notifications**, click **Enable on this browser**, accept browser permission, and use **Send test notification**. **Pause desktop alerts** stops desktop delivery while preserving Activity. Desktop text is deliberately generic. Web-only alerts need an open SideWire tab. With the extension opted in, Chrome checks for notifications about once a minute even if the panel is closed; sleeping/closed browsers and system Do Not Disturb can delay or suppress alerts. This is not guaranteed instant push.

## Required two-person device test

Use two separate real browser profiles signed into different members of the same test organization. Test web-to-panel and panel-to-web messages, selected mentions, replies, exact notification navigation, refresh/reconnect, duplicate retry, and opening both surfaces for one user. Check an unauthorized third member cannot see a DM, including by its URL. Remove test-member access and verify private content disappears and pending delivery is denied.

On each actual GPS desktop, test browser permission allowed/denied, Windows/macOS notification settings, Do Not Disturb, a closed panel, an open background web tab, sleep/wake, and extension reconnect. An API test or browser mock does not certify native OS notification delivery. Existing URL-selector PR 1 and its specific acceptance remain separate.

## Boundaries

One-to-one DMs, root/reply threads, resolved individual mentions and related desktop alerts are the pilot slice. Group DMs, manual thread subscriptions, private channels, rich formatting/files, calls, AI, email/SMS fallback and scheduled quiet hours are not added. Persistent attention is authoritative; OS display acknowledgement is not proof someone read a message. Failed desktop acknowledgements can be retried and may repeat an alert.
