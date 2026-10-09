# Message threads and followed replies

Status: **GPS pilot reply slice approved October 8, 2026; implementation candidate under validation.** Manual following and other expansions below remain proposals. Actual verification is recorded in [plan 005](../plans/active/005-gps-communication-pilot.md), not implied by implementation.

This document owns message-level reply grouping, navigation, participation and thread-specific read behavior. A Chat is the full conversation; a Thread is a root message and its replies. Common sending belongs to [Messaging](messaging-and-composer.md).

## Approved reply behavior

A member with posting access may reply to a top-level message in the same authorized work Chat or one-to-one DM. There is one reply level, not an indefinitely nested discussion tree. A cross-chat root or a reply used as another root must be rejected.

Each reply has a stable identity, author, timestamp, plain-text body, selected mentions and optional independently selected page source. Replying to a source-attributed message does not automatically use the root's page as the reply source. DM replies cannot acquire page context.

Main history shows roots with reply counts. Opening a thread shows its root and retained replies in order. The refined pilot shows the thread beside the main history when the message stage has at least 760px. Narrow web and extension layouts use a focused thread with a clear return action; hidden main-history content does not advance read state. Main-chat and reply drafts remain separate and in memory. Loading earlier replies and exact-message navigation must not silently change the draft destination.

## Participation and attention

For this pilot, the root author and previous reply authors receive subsequent reply attention while still authorized. An explicit eligible mention also creates attention. A reply that is both a mention and a DM/thread update creates one durable event per recipient, not duplicate alerts. Authoring does not notify oneself.

Activity lists relevant replies across accessible conversations. Desktop opt-in and delivery rules belong to [Notifications](mentions-and-notifications.md). Joining another linked page does not replay a thread's notifications.

## Read state

Only replies actually visible in a focused, visible client are marked read automatically. Viewing the main history does not clear unseen reply attention. Reading replies does not claim later main-chat messages were read. Dismissing or delivering a desktop alert is not proof of reading.

Opening an Activity item navigates to the exact root/reply after reauthorization. Removing access clears visible private content and prevents future authorized fetches. Older-history responses must not populate a different thread after navigation.

## Draft expansions

Manual follow/unfollow, automatic following for mention-only recipients, a dedicated Threads navigation area, recent-participant/latest-reply metadata and explicit mark-unread controls remain proposals. A future unfollow must not be reversed merely by opening a thread.

An optional Also show in channel action would reference the same reply, never copy it into a second message or duplicate attention. Rich text, files, reactions, editing, deletion and tombstones follow their separate feature owners when approved. A deleted root with replies should leave a neutral tombstone rather than exposing its old body; purging and channel archival must preserve meaningful authorized states.

## Acceptance behavior

Two authorized users can exchange replies from web and panel, receive one relevant attention item and return to the exact reply. Main-chat viewing does not clear unseen replies. Cross-chat roots, nested roots and unauthorized DM replies are rejected. Same-chat page transitions preserve draft source and destination.

## Implementation map — GPS pilot candidate

`messages.thread_root_id`, `Message::threadRoot/replies`, `SendCollaborationMessage`, `RecordMessageAttention`, `CollaborationController::messages/read`, and shared `ConversationView`/composer own the slice. `PilotCollaborationTest` covers root validation, overlapping attention and visible-ID read behavior. [Plan 005](../plans/active/005-gps-communication-pilot.md) owns execution evidence.
