# Message threads and followed replies

Status: **Draft for owner review. Core target; not established as implemented.** Earlier specifications explicitly deferred threads. See [review scope](README.md).

This document owns message-level reply grouping, thread navigation, following, and thread-specific read behavior. A Chat is the full conversation; a Thread is one root message and its replies. Common message delivery/actions belong to [Messaging](messaging-and-composer.md).

## Reply behavior

A member with posting access may reply to a message in a channel or DM. Use one level of replies, not an indefinitely nested discussion tree. Each reply has its own stable identity, author, time, reactions, edits, attachments, and optional independently selected source context. Replying to a message with a page source does not automatically attribute the reply to that page.

The main history shows the root with reply count, recent participants, latest-reply time, and unread indication. Opening it shows the root and retained replies in order. Web may use a contextual thread pane; the extension and narrow web use a focused thread view with an obvious return action. Preserve separate main-chat and thread drafts/scroll positions.

Permalinks open the correct reply and sufficient surrounding/root context, including replies older than the most recent history batch. Switching between source pages linked to the same chat must not create another thread or lose the current reply draft.

## Following and attention

The root author, reply authors, and explicitly mentioned recipients follow under the proposed defaults; anyone with access may follow or unfollow deliberately. A user who unfollows is not automatically resubscribed merely because they open the thread. A new explicit reply may offer or clearly restore following; this behavior must be consistent and visible.

Followed-thread activity appears in Threads/Activity across authorized conversations. Notifications depend on personal channel settings, quiet hours, and current access. A reply that both mentions and follows a person creates one attention event for that person, not duplicate alerts. Joining another linked page does not replay replies.

## Read state

Track thread progress independently enough that viewing the main timeline does not mark unseen replies read. Reading replies does not imply the user read later main-chat messages. Counts must deduplicate by actual message/event, not count the same reply once as a mention and again as a thread update.

Explicit mark-read and mark-unread actions follow the snapshot/revisit rules in [Activity](inbox-and-unread.md). Dismissing a notification alone is not proof that the thread was viewed. Losing access removes thread titles, counts, previews, cached content, and pending delivery.

## Broadcast and lifecycle

An optional **Also show in channel** action may surface a reference to a reply in the main timeline. It must reference the same underlying reply, with one author/time and one notification identity; do not create a copied second message. This is a convenience expansion, not necessary for the first thread experience.

Deleting a root with replies leaves a neutral root tombstone and authorized replies. Do not retain its deleted body in thread previews. Deleting a reply updates counts without deleting unrelated replies. Archiving a channel or restricting posting applies to its threads as well. Retention/purge follows the owning policy and cannot orphan accessible content without a meaningful state.

## Acceptance behavior

A user can follow a discussion, leave, receive one relevant alert, and return to the exact unread reply on web or extension. Main-chat viewing does not clear unseen thread activity. Root/reply deletion, missed events, multiple linked pages, mention overlap, archive, and participant removal preserve accurate counts and authorization. One reply broadcast into the main chat remains one message.

## Owner decisions

Confirm follow/unfollow defaults and whether reply broadcast belongs in the initial release. Nested replies and independently private subthreads are excluded; a thread inherits its parent conversation's audience.

Reference coverage: [Slack threads](https://slack.com/help/articles/115000769927-Use-threads-to-organize-discussions).
