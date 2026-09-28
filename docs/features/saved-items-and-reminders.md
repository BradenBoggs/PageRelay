# Saved items, reminders, and personal navigation

Status: **Draft for owner review. Core target; not established as implemented.** The existing shell's mockup did not approve Starred or saved-item destinations. See [review scope](README.md).

This document owns personal saved references, reminders, favorites, and custom navigation sections. Shared pins/bookmarks belong to [Channels](team-conversations.md); assigned work belongs to [Tasks](tasks.md).

## Save for later

A member may privately save an authorized message, reply, file, canvas, or task reference when that content type exists. A Later view separates items needing attention, completed items, and optional archived references. Completing a saved item changes only the member's personal state; it does not complete a team task or alter the original message.

Saving stores a reference, not a permission-independent copy of private content. Show original destination, relevant author/time, and a safe authorized preview. Opening returns to the exact retained object/message, not just the latest chat page. No one else is notified that an item was saved, completed, or removed.

Deleted or inaccessible targets show a neutral unavailable item that the member may remove. Do not keep a cached body, file thumbnail, source URL, or channel title after access is lost. Saving is not a retention exemption, export permission, or guarantee of permanent availability.

## Personal reminders

Create a one-time reminder for a saved item or an original private note. Show the exact date/time and user's timezone; presets must resolve visibly. Reminders may be rescheduled, snoozed, completed, or deleted. A timer is not a new team task or message.

At the due time create one recipient attention event, respecting pause/quiet hours and delivery preferences. Recheck referenced-content access before generating previews. If the target is unavailable, the reminder may say the item is unavailable without exposing its content. An original personal note remains private to its author.

Retries cannot produce repeated reminders for one occurrence. Completing/deleting while delivery is pending cancels future delivery where still possible; do not claim already delivered notifications can be recalled. Store actual due/completion times honestly through timezone changes and daylight-saving transitions.

Recurring personal or channel reminders are an expansion. They require occurrence identity, clear timezone/recurrence semantics, editing/cancellation rules, and recipients with current access. A channel reminder posts to a shared audience and therefore needs appropriate posting permissions and a preview; it is not the default effect of saving an item.

## Favorites and sections

Members may favorite accessible channels/DMs and organize them into private named navigation sections. This changes personal navigation only, not audience, channel ownership, notification subscriptions, or read state. A section is not a Workspace or Team. Empty or inaccessible favorites must not leak private names.

Keep favorites separate from saved messages and shared pins. Support straightforward reorder/rename/remove and sensible keyboard/touch actions. Automatically surfacing every visited external record would defeat this organization feature and remains prohibited.

## Acceptance behavior

A person saves a reply, finds it later, adds a reminder, and returns to the correct context across clients. Another member cannot discover their saved list or notes. Marking saved items complete does not change team work. Deletion, lost membership, changed source links, and retry do not leak content or duplicate reminders. Favorites/sections remain personal and never create access.

## Owner decisions

Confirm Later labels, recurring-reminder scope, reminder default time, and personal-item retention. No AI prioritization, task assignment, or public sharing of saved lists is implied.

Reference coverage: [Slack saved messages/files](https://slack.com/help/articles/360042650274-Save-messages-and-files-for-later), [Slack reminders](https://slack.com/help/articles/208423427-Set-a-reminder).
