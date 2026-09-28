# Mentions, notifications, and interruption controls

Status: **Draft for owner review. Core target.** Baseline mentions/in-product delivery were proposed, not implemented; browser/email delivery had been deferred. This document specifies target behavior without claiming notification infrastructure exists. See [review scope](README.md).

This document owns recipient selection, durable attention events, delivery preferences, notification channels, quiet hours, and deduplication. Chat/thread unread progress belongs to [Activity](inbox-and-unread.md) and [Threads](threads.md).

## Mentions and audience

Support stable-ID mentions of active eligible members in channels and DMs. Suggestions reveal only people the actor may discover; recipients must already be able to access the destination. Mentioning someone does not invite them to a private channel or grant access. Display a clear unavailable-recipient explanation without exposing hidden people.

An `@channel`-style mention targets eligible joined members, not every person able to discover a public channel. Broad mentions require permission and a recipient-count warning. An `@here`-style active-member mention is optional and must use approximate supported presence, never silent browsing surveillance. Team/user-group mentions expand only to active members who can access the destination; group membership does not grant channel access.

Text that looks like a mention but has no resolved identity is ordinary text. Renaming a person/group does not reinterpret historical recipients. Importing old messages, relinking pages, and editing plain text cannot replay a conversation's old mentions.

## Event defaults

Proposed defaults surface DMs, direct mentions, followed-thread replies, and personal reminders in Activity. Broader channel-message alerts are opt-in. Task assignments/due reminders, calls, workflow events, and invitation updates are added only when their owning features ship. Own messages do not notify their author as incoming communication.

Create one recipient attention event per underlying message or other event, with multiple reasons attached where relevant. A reply that is both a mention and a followed-thread update is not two alerts. A message linked to multiple source pages remains one event. Retry-safe identities cover in-product records and external delivery attempts.

Newly added eligible mentions in an edit may create one event for newly mentioned recipients. Editing must not replay delivery to unchanged recipients. Removing a mention cancels unsent mention-only delivery; it cannot retract an already delivered alert. Deleted content and lost access are removed from pending previews/delivery. A restored message is not automatically a new mention event.

## Preferences and precedence

Offer per-user defaults and per-conversation controls: all messages, mentions/relevant replies, or no proactive alerts. Followed threads have explicit controls. Muting suppresses interruptions, including broad mentions, while Activity can still retain authorized direct-mention records. Explain the difference between hiding badges, muting delivery, and leaving a destination.

Quiet hours use the user's chosen timezone and days; temporary pause shows its end time. Organization defaults cannot silently override a personal pause. No emergency/VIP bypass is included initially. Optional custom keyword alerts must match only authorized content, be rate-limited, and never become organization-wide monitoring.

Provide sound on/off and content-preview controls. Privacy-friendly previews can show only that there is activity, rather than a message body or private channel name. Do not put secret source URLs or attachment access credentials into lock-screen or email previews.

## Delivery surfaces

In-product Activity is the durable source. Provide desktop/browser alerts on supported active clients after an explanatory, user-initiated permission request. Do not request permissions at installation merely because they might be useful. A test-notification action should explain denied, unsupported, disconnected, or suppressed states.

Coalesce web/extension delivery for the same person/event so multiple open surfaces do not all play a sound or display the same toast. If the person is actively viewing the actual destination, suppress redundant desktop interruption without assuming all its content is read. A foreground chat and a hidden browser tab are not equivalent.

Email fallback/digests are an expansion with explicit preferences, an approved delay, and cancellation when the event is already handled. Recheck access immediately before composing/sending. Links require authentication; default to minimal content because email cannot be recalled reliably. No SMS or unrestricted forwarding to other chat services is proposed.

Closed-browser push, extension-background alerts, and native mobile push are separate capabilities. Do not promise them until the browser/OS support, delivery path, permission needs, and duplicate-handling behavior are approved and verified. A suspended browser cannot be described as reliably online.

## Delivery and read state

Queued, delivered, failed, and suppressed are delivery states, not proof that a person read a message. Notification read/dismissed state is distinct from chat/thread progress. Opening a notification navigates to its durable message/thread and rechecks authorization; it does not depend on a source page still being linked.

Quiet-hour release and reconnect must coalesce stale activity rather than flood the user. Rate-limit broad bursts and surface recoverable delivery failures without exposing sensitive payloads in logs. Pending events for deactivated users, expired guests, inaccessible channels, or removed DM participants must fail closed.

## Acceptance behavior

One mentioned recipient receives one relevant event across retry, thread overlap, multiple pages, and simultaneous clients. Quiet hours, mute, and preview privacy hold across all supported delivery channels. New membership/linking does not replay old alerts. Access revoked while delivery waits prevents content disclosure. A test notification explains why the actual device can or cannot receive it.

## Owner decisions

Confirm broad-mention roles, group/keyword alert scope, muted-direct-mention badge behavior, desktop delivery support, email fallback/digest timing, and any notification-volume limits. These choices must be visible product settings, not hidden assumptions.

Reference coverage: [Slack notification preferences](https://slack.com/help/articles/201355156-Configure-your-Slack-notifications), [Slack reminders](https://slack.com/help/articles/208423427-Set-a-reminder). SideWire defaults above are proposed, not a reproduction of Slack defaults.
