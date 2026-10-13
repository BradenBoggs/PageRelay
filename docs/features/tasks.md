# Tasks, shared lists, and action tracking

Status: **Message-linked todos and assignment approved October 13, 2026 and implemented as a local candidate; verification is recorded in plan 013. Remaining expansion targets are drafts.** The baseline proposed simple page-related tasks. This revision makes a page optional and defines shared lists without making a project-management suite a launch requirement. See [review scope](README.md).

This document owns task/list records, assignment, status, due dates, and resource permissions. Personal reminders belong to [Saved items](saved-items-and-reminders.md); automated forms and recurring actions belong to [Workflows](workflows-and-automation.md).

## Approved message-linked todos — October 13, 2026

The user approved converting messages into todos with user assignment, visible message checkmarks and a todo list linking back to the message. See [plan 013](../plans/active/013-message-todos.md) for execution/verification. Broader lists, due dates, reminders, custom statuses and independent tasks below remain proposals.

One todo belongs to one retained message, including replies and DMs. Conversion previews a required title (up to 200 characters), optional assignee and inherited chat audience. All active members with access to that chat can manage its todo, except retired chats are read-only. Creation retries return the existing todo rather than changing its assignment. Updates use a version to reject stale writes; identical retries succeed.

Assignment is optional and limited to active coworkers who can read the owning chat. Assignment grants no access and emits no new notification in this slice. Members can edit the todo title, reassign/unassign, complete and reopen; retain completion actor/time while completed. Removed assignees stay attributed and are marked as needing reassignment. An author editing a message never changes its todo title. Deleting a message retains the todo, while its original-message preview becomes “Message deleted”; never keep a hidden message-body snapshot.

The Todos view shows accessible todos only, with All/Mine and Open/Completed/All filters, pagination, assignee, completion checkbox and a live message reference. The approved concept 2 renders message todos as a compact checkbox, title and link to `/todos?todo=<id>`, with completed titles struck through. Assignment, title editing and original-message details live on the Todos page in a selected details panel; completing either view updates the same record. Narrow screens expose conversion through the existing action dropdown. No page context or extension installation is required.

## Purpose and ownership

Turn a discussion into an accountable action, whether it started beside a work page or entirely in SideWire. A task belongs to one Organization and either a personal scope or one owning shared list/conversation. A shared list has one explicit audience, normally inherited from its channel or DM. Do not combine independent permission systems or infer access from a source URL.

A task may reference a message and safe page contexts without being owned by a page. Linking or unlinking chat pages never moves tasks, changes assignees, shares a private task, or duplicates it under each App. An original message reference remains a reference, not a permanently copied private quote.

## Basic actions

Create an action from a message, channel/DM resource view, My Tasks, or an authorized linked page. Show the destination and audience before saving. Include a required title, optional description, creator, optional single active assignee, open/completed status, optional due date, and completion metadata. An unassigned task is valid. Creation does not send a chat message unless the user explicitly shares its reference.

Editors may update details, assign/reassign, complete, reopen, and archive tasks according to the owning resource's permissions. List managers control list settings and restore archived items. Assignment is responsibility, not an access grant or exclusive edit lock. Reject an assignee who cannot read the task; offer a separate authorized invitation workflow rather than silently changing audience.

Use date-only due dates initially. Display a date, not a fabricated midnight deadline in another timezone. Time-specific reminders, if enabled, show an explicit time and timezone. Due-date changes do not rewrite creation/completion history. Deactivation preserves the former assignee in history and marks open work as needing reassignment.

## Lists and views

Provide a shared table/list with title, assignee, status, and due date, plus sorting and filters. My Tasks combines only tasks assigned to or personally owned by the viewer; it cannot disclose tasks in inaccessible channels. A source page may filter related tasks without becoming a second task store.

Optional enhancements include saved views, a basic status board, bounded custom fields, subtasks, and item discussion. They are reviewable expansions, not requirements for basic assignment and completion. Any custom status must clearly map to open/completed behavior so reminders and counts remain understandable.

Item discussion inherits the task/list audience. It must not expose the originating private message to people who only have task access. Posting a list reference elsewhere does not share the list automatically. Copying a list requires an explicit audience preview and must not copy private comments, assignments, credentials, or completed history by default.

## Attention and lifecycle

Assignment/reassignment and due reminders create deduplicated events only for eligible recipients. Own assignments need not interrupt their author. Completion, archive, and access removal cancel pending due alerts; reopening does not replay old events. Creating from a mentioned message must not cause unexplained duplicate alerts.

Archiving a conversation makes attached lists/tasks read-only under the proposed default. Restoring it re-enables authorized editing; unrelated/personal lists are unaffected. Task archive is recoverable under the approved lifecycle policy. Completion does not imply deletion. Search, exports, notifications, and later AI enforce the current resource audience.

## Acceptance behavior

A teammate can create and complete an assigned action without a page. Several linked pages show one referenced task without duplicate counts. Assignment cannot grant access, and private-message previews remain private. Concurrent completion/reassignment has a coherent visible result, retained actor history, and no duplicate alerts. Archive, deactivation, due-date changes, and timezone display have predictable outcomes.

## Owner decisions

Confirm shared-task editing roles, whether list editors differ from channel posting roles, and whether boards/custom fields/subtasks belong in the first task release. Approve reminder timing, archive recovery, and list/item limits. Gantt charts, portfolios, time tracking, resource planning, and synchronization with every external task system remain outside this feature.

Reference coverage: [Slack lists](https://slack.com/help/articles/27452748828179-Use-lists-in-Slack). SideWire's simplified scope and permission defaults are proposals.

## Implementation map — approved message todos

- Persistence: `Todo`, `Message::todo`, the message-owned `todos` table and additive migration.
- Access and mutations: `ManageTodo`, `TodoController`, `TodoResource`, shared collaboration routes. Visibility follows `ConversationAccess`; retired chats are read-only.
- Message state and missed-event recovery: `MessageResource`, `CollaborationController::messages`, existing signal-only `MessageCreated` event.
- Shared UI: `todos.tsx`, `MessageRow`, `CollaborationClient` todo types; extension board exposes the same Todos list without new permissions.
- Web entry: `/todos`, `resources/js/pages/todos/index.tsx`, `AppNavigation`.
- Coverage: `MessageTodoTest`, `tests/Browser/message-todos.cjs`; actual evidence/omissions in [plan 013](../plans/active/013-message-todos.md).
