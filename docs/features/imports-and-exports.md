# Communication imports, exports, and portability

Status: **Draft for owner review. Expansion target; not established as implemented.** Migration from another chat platform is optional scope, not approval to ingest private data indiscriminately. See [review scope](README.md).

This document owns supported import/export packages, mapping, provenance, permission-safe transfer, and job outcomes. Ordinary page linking is not an import. Retention and special compliance access belong to [Administration](administration-and-data-lifecycle.md).

## Import preview

An authorized Organization manager may provide a supported export package they are authorized to use. Identify accepted source formats and limitations explicitly; do not promise every Slack export, file link, application payload, or historical feature is portable. Do not request another user's credentials or bypass a source platform's export permissions.

Before importing, validate the package and show a preview of channels, people, messages/replies, files, source dates, unsupported elements, and intended target audiences. Private data must not default into public channels. The manager confirms mappings and scope. Test/preview mode creates no live invitations, messages, or notifications.

Default to separately named import destinations with restricted review access. Importing private chats/DMs requires an approved participant-identity and history-disclosure policy; until then, explicitly reject or exclude that content rather than converting it to public history. Do not automatically merge nonempty existing chats.

## Mapping and provenance

Preserve source identifiers, original author labels, original timestamps, thread relationships, and import-batch identity separately from actual SideWire creation time. Imported content is labeled as imported, not attributed as a SideWire message sent while viewing a page.

A source identity does not automatically create an active account, invitation, seat, or channel membership. Mapping to an existing account must be deliberate and verifiable; unmapped former authors can remain historical identities. Duplicate names or unverified matching emails are not sufficient grounds to merge private identities silently.

Files are imported only when available and authorized, then pass the ordinary upload/security/access rules. Expired source-file links are reported as unavailable rather than claimed as copied. Embedded source URLs are validated as ordinary references; they do not automatically create page contexts or primary chat associations.

## Runs and recovery

A batch has a stable identity and clear preview, running, complete, partial, failed, or canceled status. Retrying a processed item cannot duplicate messages, replies, files, or authors. Imported old messages/mentions must not generate a flood of live notifications or mark previously read current content unread.

Report imported, skipped, and failed counts and reasons without exposing unrelated private content. Cancellation does not pretend that already-published records disappeared. Any rollback must distinguish import-owned records from later human replies or edits and never delete subsequent work automatically.

## Exports

Provide a scoped export of supported authorized data with a manifest naming the included conversations/resources, date bounds, format, and limitations. File links alone are not described as a complete file backup. Stable relationships and timestamps should permit meaningful human review and future portability.

Ordinary owners/admins do not automatically gain access to employee DMs or private channels through an export button. Start with an explicitly authorized public-channel/owned-resource scope; private/compliance exports need separately approved access, disclosure, and review. Export eligibility is rechecked before generation and download, not only when queued.

Export packages contain sensitive data: protect storage/download, define expiration, audit creation/download, and never expose them through public links. Revoked access cancels pending exports where possible; already downloaded copies cannot be recalled. Exports obey retention and exclude deleted/purged bodies and unauthorized derivatives.

## Acceptance behavior and decisions

An import preview predicts its audience and maps identities without creating active users. Retrying produces no duplicates or old-message alerts. Unavailable files are reported honestly. Export manifests match the actual scope and do not reveal private content beyond the requester's authority. Access revocation blocks queued delivery/download.

Owner decisions: first supported source format, private-history import policy, identity verification, attachment handling, export scope/format, package expiry, and rollback boundaries. Full compatibility with every source platform and background synchronization are excluded.

Reference coverage: [Slack imports](https://slack.com/help/articles/217872578-Import-data-from-one-Slack-workspace-to-another) and [Slack exports](https://slack.com/help/articles/201658943-Export-your-workspace-data).
