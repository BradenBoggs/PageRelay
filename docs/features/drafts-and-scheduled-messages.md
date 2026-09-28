# Persistent drafts and scheduled messages

Status: **Draft for owner review. Core persistent drafts; scheduled send is expansion.** The existing web shell documents only a member/organization-scoped in-memory cache cleared by reload/logout. It does not establish persistent or cross-device drafts. See [review scope](README.md).

This document owns unsent draft persistence, multi-client conflict behavior, draft discovery, and deliberately scheduled delivery. [Messaging](messaging-and-composer.md) owns acknowledged sends; [Page linking](page-conversations.md) owns source validation.

## Draft identity and privacy

A draft belongs to its author and Organization and is bound to an explicit destination, optional thread, and selected source context. Keep different thread and main-chat drafts separate. Direct web or DM drafts have no inferred active browser tab. Switching tabs, following a new page, or opening another linked page cannot silently reattribute existing text.

Autosave supported content to the private draft store with a visible saved/unsaved state. A Drafts view lets the author resume or discard their unsent work across supported clients. Other members and ordinary organization admins cannot search or read personal drafts through collaboration features. Drafts are not published messages and do not generate typing beyond the current active conversation, mentions, unread counts, or notifications.

Draft text can be stored before final submission validation, but do not persist prohibited credential-bearing source URLs as a draft's source association. File attachments retain their upload/processing state; an unsent draft must not make an upload public.

## Concurrent editing and recovery

Use draft versions so a stale autosave from another tab cannot overwrite newer text silently. On conflict, preserve the local version and offer a clear choice to review/replace rather than combine unrelated text automatically. Show the destination/source before sending a recovered draft.

Successful send clears only the submitted version. Text typed or edited while the send was processing must survive; rotating a request key cannot cause a duplicate post. A failed send retains content and retry identity. Reconnect does not automatically transmit ordinary failed/offline drafts without the user's deliberate send/retry action.

On destination archive or posting/access loss, disable sending and explain the state. Do not copy lost-access message quotations, private previews, or attached files into a new public destination. The author may recover their own original text where permitted, but retaining a draft is not continued access to the old conversation. Logout/revocation clears sensitive client caches; unsent-upload cleanup and server draft retention follow a disclosed policy.

## Scheduled send

An author may explicitly choose a future date/time for a channel/DM/thread message. Show the timezone, destination, recipients/audience, source selection, and an exact confirmation. The schedule is a private pending item, not a posted message; no recipients are notified until delivery succeeds.

Offer edit, reschedule, cancel, send now, and return-to-draft. Updates near the send time must have one clear winner: cancellation can report that a message already sent, but may not claim success and then deliver anyway. A completed schedule points to one actual message.

Recheck active author membership, destination access/posting status, thread existence, attachments, commercial access, and source association at execution time. Never reroute to a newly linked chat or impersonate the author after removal. If the selected source is no longer valid, stop and ask the author to remove/change it; do not silently strip attribution. An unavailable destination or failed upload produces a recoverable failure visible to the author.

A scheduler outage must not create duplicates. Late execution follows a disclosed tolerance and marks the actual send time accurately; a substantially late item can require author review. The desired schedule time is not a fabricated message timestamp. Quiet hours affect recipient interruption, not whether an otherwise valid scheduled message can be posted.

## Acceptance behavior

Drafts survive supported navigation/reload and resume across clients without cross-chat or cross-member leakage. Concurrent autosaves do not silently lose text. Sending clears only the version actually sent. A canceled/rescheduled item cannot also post twice under retries. Author removal, channel archive, invalid source mapping, or permission loss at execution prevents delivery and provides an honest state.

## Owner decisions

Approve server draft retention, private-draft operational access/disclosure, abandoned-upload cleanup, supported offline persistence, maximum scheduling horizon, and late-execution tolerance. Exact offline encryption/storage behavior requires security review. Recurring messages belong to Workflows, not an implicit scheduled-send loop.

Reference coverage: [Slack message drafting and scheduling](https://slack.com/help/articles/201457107-Send-and-read-messages). The draft conflict and provenance rules are SideWire proposals.
