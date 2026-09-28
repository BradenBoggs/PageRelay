# Forms and bounded workflow automation

Status: **Draft for owner review. Expansion target; not established as implemented.** The previous MVP excluded a workflow builder. This is optional scope, not a dependency of messages or page linking. See [review scope](README.md).

This document owns reusable workflows, forms, triggers, actions, publishing, and run visibility. Provider authentication belongs to [Integrations](integrations.md); tasks, messages, and notifications retain their own permissions.

## Purpose and scope

Let a team automate a few repeated coordination actions: collect a structured request, post a notification, create/assign a task, or send a scheduled channel reminder. Start with a small documented set of triggers and actions rather than arbitrary code or a general application builder.

Possible triggers are a deliberate shortcut/form submission, an approved schedule, or a verified integration event. Visiting a webpage is not an approved trigger: do not turn the extension into a background activity monitor. A page context can be a user-selected reference without authorizing access to external page contents.

## Definition and publishing

A workflow has an owner, Organization, readable name, draft/published/paused state, trigger, explicit execution identity, permitted destinations, and bounded actions. Creation and publishing are separate. Before publication show audience, credentials/apps used, likely notifications, and any external writes. Editing a published workflow produces a reviewed version; it must not silently replace a run already in progress.

Use a preview/test mode that cannot send real notifications or mutate production resources without a clear choice. Permissions are checked when defining, publishing, and running. A workflow does not retain all powers its creator once had; owner deactivation or revoked app access pauses affected work until an authorized reassignment/review.

## Forms and actions

Forms expose explicit labeled fields, required/optional rules, input limits, and a disclosure of who will see submissions. Submission destinations inherit the intended channel/list audience. An external public form is a separate feature requiring authentication/abuse/privacy decisions; sharing an internal form link does not make it public.

Actions call the ordinary message/task/integration behaviors, including membership, posting restrictions, file safety, and notification deduplication. A workflow cannot invite itself into private channels or approve its own consequential action. Human approval steps, when added, show approver identity, requested changes, and an auditable explicit decision.

Conditional steps, collection/repeat actions, delays, and reusable templates are optional enhancements. They require bounded runs, cancellation, and loop prevention. No unbounded recursive message triggers, arbitrary scripts, or unrestricted network actions are included.

## Runs and recovery

Each trigger occurrence identifies one run and each side effect is safe to retry. Display pending, running, succeeded, partially failed, canceled, or blocked outcomes honestly. Retrying a later failed action must not repost an earlier successful message. If rollback is impossible, state what already happened rather than claiming the entire workflow was undone.

Revalidate the execution identity, current resource access, archive state, and approved provider scopes before side effects, including after a delay. A removed recipient or expired guest cannot receive protected content from an old run. Schedules show timezone and recurrence; changes/cancellation affect future occurrences without duplicating active ones.

Provide an authorized run history with useful outcomes but no unnecessary message bodies, form secrets, or unrestricted payloads. Pausing stops new runs and makes pending-run handling explicit. Deleting a workflow does not delete the team's completed messages/tasks.

## Acceptance behavior and decisions

A team can preview and publish a simple form-to-task workflow, see its actual result, and retry a failed step without duplication. Access loss or archive blocks delayed unauthorized writes. A changed workflow version cannot silently alter an active run. Loops and repeated triggers remain bounded.

Owner decisions: initial trigger/action catalog, publishing roles, run quotas, delay/timezone rules, forms retention, and approval steps. A large visual programming platform and public automation marketplace are excluded.

Reference coverage: [Slack Workflow Builder](https://slack.com/features/workflow-automation). SideWire defaults and limits remain proposed.
