# Mentions, notifications, and interruption controls

Status: **GPS pilot slice approved October 8, 2026; implementation candidate under validation.** Browser desktop delivery is in scope, but native GPS-device acceptance and production deployment are not established. Broader controls below remain proposals. See [plan 005](../plans/active/005-gps-communication-pilot.md).

This document owns recipient selection, durable attention, delivery preferences and deduplication. Chat/thread reading belongs to [Activity](inbox-and-unread.md) and [Threads](threads.md).

## Approved individual mentions

Typing @ opens a selection of eligible active coworkers. Selecting a person records their stable user ID and shows a removable recipient chip. Text that merely resembles @name is ordinary text, not a notification. Renaming a user does not reinterpret stored recipients.

Suggestions and sending recheck organization membership and destination access. A mention cannot invite someone into a DM or grant access to a private destination. In a one-to-one DM, only its participants are eligible. Own messages do not notify the author.

## Durable attention and reading

Create one attention item per recipient/message for selected mentions, incoming DMs and replies in participated threads. Where reasons overlap, the pilot displays mention before DM before thread. Multiple linked pages and retries cannot multiply the event.

Activity remains the durable source even when desktop notifications are disabled. Only authorized recipients can fetch its text or exact message/thread link. Marking visible message IDs read clears only their attention, never unseen replies. Desktop delivery, dismissal and reading are separate facts.

## Desktop opt-in and privacy

The user explicitly enables notifications on a browser. Web permission is requested only from that button and requires a supported secure context. The extension requests its optional notifications permission from the same explicit action. Provide a test notification and a pause control; denied or unsupported permission must have a useful explanation.

The pilot always uses generic desktop text, with no message body, coworker/customer name, private chat name, source URL or attachment credential. Clicking opens the authorized SideWire message/thread rather than a host website. Permissions and the operating system may suppress the visual alert even after the API accepts it.

The preference is per user/organization; browser permission remains local. Pausing desktop delivery preserves in-product Activity. Enabling does not replay older attention created before opt-in. Only undelivered unread attention from the last day is eligible, in bounded batches of five.

## Delivery across clients

Open web and panel clients subscribe to existing Reverb signal-only events and perform newly authorized reads. A disclosed 30-second collaboration recovery check handles missed connections; focus/online events also reconcile. This never polls or records the source webpage.

Web-only alerts require an open SideWire tab. With the extension opted in, notification-only Chrome alarms check approximately once a minute even when the panel is closed. Browser shutdown, suspension, sleep and Do Not Disturb can delay or suppress delivery. This is not guaranteed instant closed-browser push.

A server-issued 45-second claim coalesces competing web/extension clients. Successful notification API submission is acknowledged separately from reading. Failed display or lost acknowledgement can be retried after the lease; exactly-once OS presentation is not promised. Already-read items are not newly claimable. Every claim/acknowledgement rechecks current access and recipient identity.

## Draft expansions

Per-conversation mute, all-message settings, quiet-hour schedules, timed pauses, configurable previews/sounds, keyword alerts, reminders and manual thread-follow controls are outside this pilot. Future quiet hours use an explicit timezone and cannot be bypassed by organizational defaults.

Broad @channel, @here and Team/group mentions need permission, audience-count warning and bounded eligible membership. Presence must not become browsing surveillance. Edits may notify newly added recipients only under an approved editing feature; imports, page relinking, restoration and unchanged mentions must not replay old alerts.

Email fallback/digests, native mobile push and other channels require separate preferences, reauthorization and delivery acceptance. No SMS or unrestricted forwarding is introduced. Future calls, task assignments and workflow notifications are owned by those features, not guessed here.

## Acceptance and implementation map

Validate individual selection, same-message deduplication, private previews, pause/test/permission states, no historical opt-in replay, lease retry, exact-link navigation, removal of access, and unseen-thread read separation. Native OS checks on actual GPS desktops remain required; API mocks and CI do not certify them.

`message_mentions`, `message_notifications`, `notification_preferences`, `RecordMessageAttention`, `MessageNotificationController`, shared collaboration controls/client, and the extension service worker implement the candidate. `PilotCollaborationTest` covers authorization, consent, reasons and delivery claims. [GPS pilot setup](../engineering/GPS-PILOT.md) owns deployment/device checks.

References: [Chrome notifications](https://developer.chrome.com/docs/extensions/reference/api/notifications), [Chrome alarms](https://developer.chrome.com/docs/extensions/reference/api/alarms), [Web notification permission](https://developer.mozilla.org/en-US/docs/Web/API/Notification/requestPermission_static).
