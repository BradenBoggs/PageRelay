# Shared notes, canvases, and reusable templates

Status: **Draft for owner review. Expansion target; not established as implemented.** See [review scope](README.md).

This document owns lightweight collaborative documents, document permissions, revisions, comments, and templates. Messages remain communication history; files, tasks, and external pages remain referenced resources.

## Purpose and scope

Give a channel or private group a durable place for decisions, procedures, reference information, and meeting notes. A document may also begin as an author's private note. It is useful without an external page and does not extract the host application's content.

Use one explicit ownership mode: a document inherits a single conversation's audience, or it has a private owner with an explicitly shared recipient list. Do not silently switch modes. Sharing into a broader conversation must show the new audience and require appropriate authority. A link alone is not a permission grant.

## Editing and organization

Support headings, paragraphs, lists/checklists, safe links, simple tables, authorized file references, and links to SideWire messages/tasks. Include a title, owner/scope, editor permissions, timestamps, and current saved revision. A heading outline helps with longer notes. Reuse safe common formatting; documents must not execute embedded code.

Offer viewer, commenter, and editor permissions when explicit sharing is supported. For a conversation-owned document, reading cannot be granted outside that conversation; editing/commenting may be restricted further. Managers manage attached documents they can access, not every private document in the Organization.

Autosave displays saved/unsaved state. Concurrent edits must converge safely or present a recoverable conflict without silently discarding changes. This specifies the user outcome, not a required editing algorithm or framework. Preserve local unsaved work where safe during interruption.

## Comments, revisions, and templates

Comments and mentions use the document's current audience and notification rules. Commenting on a private-message reference does not grant access to that message. Resolved comments remain subject to the chosen retention policy and do not become unrelated chat messages.

Show useful revision information and allow authorized editors to restore a retained version as a new revision. Restoration cannot resurrect permanently purged content or expose historically private previews to a new audience. Deleted/inaccessible references render as unavailable.

Templates copy structure and deliberately selected reusable text, not private histories, comments, participants, credentials, or completed task records. Creating a reusable template from a document requires reviewing its contents and audience. Do not publish a private note as an organization-wide template implicitly.

## Discovery and lifecycle

Documents are reachable from shared conversation resources and authorized document search. A page may offer a shortcut through its linked chat; multiple page links do not create copies or another permission boundary.

Conversation archive makes attached documents read-only under the proposed default. Document deletion hides normal content and previews immediately; recovery and physical purge follow the lifecycle policy. Removing a collaborator revokes future document, revision, comment, file, search, export, and AI access.

## Acceptance behavior

A team maintains shared notes without an extension. Concurrent edits do not silently lose work. Viewer/commenter/editor roles hold at server boundaries. Sharing previews the audience; referenced private messages/files remain independently authorized. Template creation and revision restore cannot reveal hidden history or recover purged content. Archive and membership changes apply to derived surfaces.

## Owner decisions

Choose whether the initial release supports only conversation-inherited documents or also explicit private sharing. Confirm editing defaults, revision/recovery duration, comments, and templates. Full office-document compatibility, spreadsheets, slides, public publishing, and arbitrary embedded applications are excluded.

Reference coverage: [Slack canvases](https://slack.com/help/articles/203950418-Use-a-canvas-in-Slack). SideWire's scope and permission defaults are proposals.
