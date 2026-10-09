# GPS pilot setup and acceptance

Status: implementation candidate; not deployed or certified for live GPS use. See [plan 005](../plans/active/005-gps-communication-pilot.md) for actual checks and limitations.

## Prepare the pilot environment

Deploy the existing Laravel application using its supported PostgreSQL/Redis setup, HTTPS, migrations, queue worker and Reverb service. Use normal authenticated accounts and organization invitations; do not share an owner login or insert invented employee accounts. No billing bypass or new commercial policy is added.

Set the actual HTTPS app origin in APP_URL and VITE_SIDEWIRE_APP_URL. Configure existing server/browser Reverb variables consistently with TLS. Build both clients with the repository's build command. The extension build writes only that exact app origin to its manifest; development HTTP is allowed only for localhost/127.0.0.1.

Load the built `apps/extension/dist` as an unpacked extension for this controlled pilot, then copy its actual ID from Chrome's Extensions page. Add that ID alongside the web app hostname in REVERB_ALLOWED_ORIGINS on the Reverb server. These are host values: the extension ID and app hostname, not full page URLs. Do not use a wildcard to work around an origin error. Different unpacked-install paths can produce different IDs; record and allow only the actual pilot installations. Apply the normal Reverb restart procedure after changing its configuration.

Apply the additive collaboration migration through the normal deployment procedure after taking a backup. Never use a production database for test suites or roll back the new tables to solve a UI error. Public Chrome Web Store distribution is separate from this controlled unpacked pilot.

## Use the pilot

Open Messages, DMs & mentions in the web navigation, or Messages & DMs in the panel. Open Direct messages, choose New direct message, search for an active coworker and select them. Shared work Chats remain organization-wide; use a DM for private discussion. DMs never attach the current browser page.

In a message or reply, type @ and select a suggested coworker. Only selected people shown in the recipient chips are notified; plain @name text alone does not notify. Choose Reply in thread on a root message. Its author and previous reply authors receive new thread activity. Reading a main Chat does not clear unseen reply attention.

Open Notifications, click Enable on this browser, accept browser permission and use Send test notification. Pause desktop alerts stops desktop delivery while preserving Activity. The server preference is per user/organization; browser permission and extension opt-in remain local. Desktop text is deliberately generic.

Web-only alerts need an open SideWire tab. With the extension opted in, Chrome checks for notifications about once a minute even if the panel is closed. Sleeping/closed browsers and system Do Not Disturb can delay or suppress alerts. This is not guaranteed instant push. Desktop delivery acknowledgement is not proof the recipient read a message.

## Required two-person device test

Use two real browser profiles signed into different members of the same test organization. Test web-to-panel and panel-to-web messages, selected mentions, replies, exact notification navigation, reconnect, duplicate-send retry and opening both surfaces for one user. Check that an unauthorized third member cannot see a DM, including by URL. Remove test-member access and verify private content disappears and pending delivery is denied.

On each actual GPS desktop, test permission allowed/denied, Windows/macOS notification settings, Do Not Disturb, a closed panel, an open background web tab, sleep/wake and extension reconnect. Check the actual native side-panel container at resized widths and switch between linked/unlinked pages while preserving a draft. An API test, Chromium extension tab or mocked notification class does not certify these device behaviors.

The separate URL-selector PR 1 and its acceptance remain outside this pilot branch. Deploy neither unreviewed work nor public availability claims merely because this pilot's automated checks pass.

## Boundaries

One-to-one DMs, root/reply threads, resolved individual mentions and their desktop alerts are the pilot slice. Group DMs, manual thread subscriptions, private channels, rich formatting/files, calls, AI, email/SMS fallback and quiet-hour scheduling are excluded. Lost desktop acknowledgements can be retried and may repeat an alert; exactly-once OS presentation is not promised. Durable Activity remains the fallback record.
