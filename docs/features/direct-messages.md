# Direct messages and private groups

Status: **Draft for owner review. Core target.** Baseline documentation approved one-to-one DMs for a later milestone; it did not establish their implementation. Group DMs were deferred. See [review scope](README.md).

This document owns DM participants, discovery, privacy, lifecycle, and participant changes. Common message behavior belongs to [Messaging](messaging-and-composer.md), replies to [Threads](threads.md), and attention to [Notifications](mentions-and-notifications.md).

## Purpose and creation

Let coworkers communicate privately without a channel or external page. A member can select another active member of the same organization to start or reopen their one-to-one DM. The same pair resolves to one durable history; retries and simultaneous starts must not duplicate it.

Provide a private notes-to-self conversation with the same basic composer, search, and saved-reference behavior. It is not an organization announcement channel and does not notify the author about their own notes.

Allow small group DMs with an explicit participant list and optional descriptive name. The recipient list is visible before sending. The server validates all participants and configured group-size limits. Do not infer membership from a pasted address, Team name, shared source URL, or organization role.

## History and participant changes

A group's audience is part of its identity. Adding or substituting a person creates a new group with no automatic copy of the prior private history. Clearly explain this instead of silently exposing earlier messages. Exact participant-set reuse may open the already-existing group if the user is shown which history will open; otherwise an explicit new group must not merge histories.

Members may leave a group, removing future access and deliveries. Old messages retain their authors and timestamps for the remaining authorized participants. A re-invitation uses the same explicit new-group rule; it must not silently restore the old history to a person who left. Removing someone is not a way to retract information already delivered.

Conversion to a private channel is an expansion, not a prerequisite. It requires consent/authority rules, an explicit audience and history preview, and no accidental public visibility. Until those rules are approved, offer creation of a separate private channel without copying messages.

## Access and source context

Only current participants may read, post, search, receive notifications, subscribe to realtime, download files, join associated calls, or access derived tasks and canvases. Owners, organization administrators, and nonparticipant channel managers do not automatically gain DM access. Internal operational access, when necessary, follows the disclosed audited policy in [Administration](administration-and-data-lifecycle.md).

DMs cannot be primary page-link destinations. They do not inherit the active tab or the last page used in the extension. A participant may deliberately paste a normal link or reference an authorized SideWire message, but sharing a link does not grant access to its destination. Do not produce a private message preview for a recipient who cannot read it.

## Everyday behavior

DMs appear in the participant's web and extension navigation, Activity, search, unread views, and notification preferences. Support threads, reactions, files, edits, deletion, saved items, and drafts through the common features rather than special weaker DM implementations.

Hiding a DM removes it from personal navigation, not its history or the other participant's view. A new received message may surface it again unless muted. Muting controls interruption; it does not block server access or delete messages.

Removing/deactivating an organization member stops that member's sessions and pending delivery. Remaining participants may retain authorized history with a clear inactive-author label. A one-to-one composer becomes unavailable while its other participant is inactive; historical messages remain accessible to the remaining participant. Reactivation must be explicit and must not silently revive old group memberships.

## Acceptance behavior

The same pair has one history across web/extension and concurrent starts. A group participant change cannot expose earlier history to a new person. A nonparticipant administrator cannot retrieve a DM through search, file URLs, previews, notification records, exports, calls, or page linking. Leaving/deactivation revokes future access without deleting others' history. Hidden, muted, unread, and deleted are distinguishable states.

## Owner decisions

Confirm group-size limits, the new-group history rule, notes-to-self, and future reporting/blocking behavior. Abuse reporting must disclose exactly what content is shared with a reviewer; a report is not blanket access to a private conversation. Cross-organization and guest DMs require the external-collaboration feature and are not approved by this document.

Reference coverage: [Slack messaging and group-DM help catalog](https://slack.com/help/categories/200111606-Using-Slack).
