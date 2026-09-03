# Page-aware tasks

Status: proposed Phase 3 feature; not implemented.

This document owns SideWire's lightweight task records, assignment, status, due dates, and relationship to page contexts and conversations.

## Purpose

A team should be able to turn a conversation beside any web tool into a clear action without relying on that tool to have its own task system. Tasks make SideWire useful across tools while remaining lighter than a complete project-management platform.

## Proposed first version

A task belongs to one organization and normally one page context. It includes an opaque identifier, required title, optional description, creator, optional assignee, open or completed status, optional due date, completion metadata, and timestamps.

Authorized organization members may:

- create a task from the current page context;
- assign it to an active organization member or leave it unassigned;
- edit title, description, assignee, and due date;
- complete and reopen it;
- view open and completed tasks for the current context;
- navigate from the task to the source page and related conversation.

Creating a task from a message may preserve a reference to that message without copying mutable message content into the task.

## Status and lifecycle

Begin with `open` and `completed`. Do not add boards, custom statuses, priorities, dependencies, subtasks, recurring tasks, effort estimates, sprints, or workflow automation until usage requires them.

Completion records who completed the task and when. Archive or soft deletion requires a deliberate recovery policy; permanent deletion should not be the default.

## Assignment and notifications

Assignment does not create page-specific access. The assignee must already have access through the organization. Assigning or reassigning creates one deduplicated notification when notifications exist. Removing a member must preserve task history and safely unassign or label affected open tasks according to an approved policy.

## Cross-tool task view

The current page shows its tasks in the panel. A later My Tasks view combines assigned work across all source tools and provides open/completed and due-date filters. It must retain recognizable source site/context and a safe return link.

## Open decisions

- Whether tasks can exist without a page context.
- Task comments versus using the associated page conversation.
- Due-time and timezone behavior versus date-only due dates.
- Who can edit or complete another person's task.
- Task deletion, retention, and removed-member behavior.
- Whether team and direct conversations can create tasks.

## Out of scope

Gantt charts, kanban boards, workload planning, time tracking, approvals, forms, automations, custom fields, dependencies, portfolios, and bidirectional sync with every external task system are not part of the lightweight feature.
