# Tasks, shared lists, and action tracking

Status: **Draft for owner review. Expansion target; not established as implemented.** The baseline proposed simple page-related tasks. This revision makes a page optional and defines shared lists without making a project-management suite a launch requirement. See [review scope](README.md).

This document owns task/list records, assignment, status, due dates, and resource permissions. Personal reminders belong to [Saved items](saved-items-and-reminders.md); automated forms and recurring actions belong to [Workflows](workflows-and-automation.md).

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
