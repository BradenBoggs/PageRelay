# Direct messages and private groups

Status: **One-to-one GPS pilot approved October 8, 2026; implementation candidate under validation.** Group DMs and the other expansions below remain drafts. Actual results belong to [plan 005](../plans/active/005-gps-communication-pilot.md), not this status label. No production release is claimed.

This document owns DM participants, discovery, privacy, lifecycle, and participant changes. Common message behavior belongs to [Messaging](messaging-and-composer.md), replies to [Threads](threads.md), and attention to [Notifications](mentions-and-notifications.md).

## Approved pilot behavior

Let coworkers communicate privately without a channel or external page. An active member can select another active member of the same organization to start or reopen their one-to-one DM. The same pair resolves to one durable history; retries and simultaneous starts must not duplicate it. The recipient's name and the two-person audience are visible before sending.

Only the two participants may read or post, discover the DM, receive its notifications or subscribe to its realtime channel. Owners and organization administrators do not gain access to coworkers' DMs merely through their role. Every history, thread, mention-recipient and notification request rechecks organization membership and participation.

DMs cannot be primary page-link destinations. They never inherit the current tab, last webpage or another chat's draft source. A participant may deliberately paste a normal link, without granting access to its destination.

The pilot supports plain-text messages, selected individual mentions, one-level replies, earlier-history navigation, exact message links, in-memory drafts and related Activity/desktop alerts through the shared features. New-DM selection excludes the sender. Activity ordering updates when a message is sent.

Removing/deactivating an organization member stops their access and pending delivery. The remaining participant retains authorized history, but the composer is unavailable while the other participant is inactive. Historical authorship is not deleted. Reactivation must be explicit.

## Draft expansion: private groups and notes to self

Provide private notes to self without incoming-message alerts to the author. Allow small group DMs with an explicit participant list, configured size limit and optional descriptive name. These are not part of the GPS pilot.

A group's audience is part of its identity. Adding or substituting a person creates a new group without copying prior private history. Exact participant-set reuse must show which history will open. Members may leave, removing future access and delivery without deleting others' history. Re-invitation must not silently restore access to old private history.

Conversion to a private channel is a separate expansion requiring explicit audience/history rules. Do not infer participation from a pasted address, Team name, source URL or organization role.

## Draft expansion: everyday controls

Search, saved items, reactions, files, edits, deletion, hiding and muting use their common feature owners rather than weaker DM-specific versions. Hiding affects personal navigation, not history. Muting controls interruption, not authorization. New activity may resurface a hidden conversation according to approved settings.

Future files, previews, calls, tasks, canvases, exports and AI must use the same participant boundary. Operational access follows the disclosed audited policy in [Administration](administration-and-data-lifecycle.md); no blanket admin bypass is created here.

## Acceptance behavior

The same pair has one history across web/extension and retries. A nonparticipant administrator cannot discover or retrieve a DM, its replies, mention list, notifications or broadcast content. Membership removal denies further access; the counterpart retains read-only history. DM messages never acquire a browser-page source.

## Implementation map — GPS pilot candidate

`CreateDirectChat`, `ConversationAccess`, `ConversationPolicy`, `SendCollaborationMessage`, `CollaborationController`, and `conversation_participants` own identity, authorization and sending. Shared UI is under `resources/js/components/collaboration/`, used by `/messages` and the extension. Regression coverage is `tests/Feature/Conversations/PilotCollaborationTest.php`. [Pilot setup](../engineering/GPS-PILOT.md) owns device/deployment checks.

## Owner decisions outside this pilot

Group size, notes to self, hiding/muting, participant-change UX and future reporting/blocking remain review decisions. A report must disclose exactly what content is shared with a reviewer. Guest and cross-organization DMs require the external-collaboration feature.
