# SideWire feature review: team communication plus page context

Status: **DRAFT FOR OWNER REVIEW — September 27, 2026.** These are feature proposals, not blanket implementation approval, a release commitment, or a claim of shipped Slack parity.

The initial feature review examined all 16 baseline feature documents at `f7c7212ae12f1453daea5df7b26d11f0e503b02b`, revised 13, and added 14 feature specifications plus this index. Baseline implementation statements come from those documents, not a new runtime audit. Billing, referrals, and marketing were reviewed and left unchanged.

The follow-up documentation/agent reorganization is indexed in [docs/INDEX.md](../INDEX.md). It moves existing execution records into active/completed lifecycle folders without inventing verification results, adds scoped guidance and structural checks, and creates no new feature ExecPlans. See [the plan register](../plans/README.md).

## Product direction

SideWire should support everyday team communication as a complete web application, with an optional Chrome side panel that brings the same conversations beside work pages. Installing the extension, having a source URL, or connecting an external service must not be required to create a channel, send a DM, search, or catch up.

A page context is an additional entry point and useful message provenance, not the owner of history. One chat can have many linked pages; one context has at most one current primary chat. Ordinary web messages have no inferred browser source. Links do not import external messages, merge histories, subscribe users, or grant access.

Keep Organization as tenant/billing boundary, the existing default Workspace, authoritative organization memberships, and Teams as groups of people. Apps is an optional source-site filter rather than the required web hierarchy. No organization/workspace switching, per-domain workspace, Project model, or rename-only migration is approved by this review.

## Scope and authority

Each feature separates its documented baseline from its proposed target. **Core** means recommended for credible everyday communication, not already built or all required in one release. **Expansion** is separately reviewable additional scope. **Strategic** is a larger product/security commitment, not a launch dependency. These are product-scope labels, not execution phases.

Product/UI/Architecture still describe the narrower approved baseline. New agent/process guidance routes contributors through this index but does not approve its feature targets. On acceptance of a specific target, align its owning feature and affected overview statements before implementing it. Do not rewrite historical plans as if new behavior had always been approved or shipped.

Feature documents own behavior and acceptance. Execution plans own implementation sequence, progress, decisions, and evidence. Current implementation maps are navigation aids, not proof that every proposal is implemented. New features have no invented maps or test claims.

## Coverage and ownership

| Capability                                                           | Documented baseline / gap                                                                  | Proposed owner and scope                                                                                               |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Page identity and safe URLs                                          | Implemented workflow documented; retain conservative identity and no passive visit logging | Core: [Page contexts](page-contexts.md)                                                                                |
| Durable Chats, cross-app linking, provenance                         | Implemented workflow documented; retain one history and no nonempty-history merge          | Core: [Page linking](page-conversations.md)                                                                            |
| Public/private channels, General, membership, archive, announcements | Organization-wide work Chats exist; distinct audiences/admin deferred                      | Core: [Channels](team-conversations.md)                                                                                |
| One-to-one/group DMs and notes to self                               | One-to-one planned; groups deferred                                                        | Core: [Direct messages](direct-messages.md)                                                                            |
| Rich messages, reactions, edit/delete, permalinks, full history      | Plain text; shell documents latest-100-message limitation                                  | Core: [Messaging](messaging-and-composer.md)                                                                           |
| Replies, followed threads, thread unread                             | Deferred                                                                                   | Core: [Threads](threads.md)                                                                                            |
| Attachments, snippets, safe links/previews                           | Deferred                                                                                   | Core files, preview expansion: [Files and links](files-and-links.md)                                                   |
| Activity, unread, following, mark unread                             | Minimal work-Chat discovery/read state documented                                          | Core: [Activity](inbox-and-unread.md)                                                                                  |
| Mentions, alerts, preferences, quiet hours                           | In-product mentions proposed; external delivery deferred                                   | Core controls and supported desktop delivery: [Notifications](mentions-and-notifications.md)                           |
| Full-history search and filters                                      | Basic discovery search exists; broader search proposed                                     | Core: [Search](search.md)                                                                                              |
| Persistent drafts and scheduled send                                 | In-memory web drafts only                                                                  | Core drafts; expansion scheduling: [Drafts](drafts-and-scheduled-messages.md)                                          |
| Saved items, reminders, favorites                                    | Not a complete specified feature                                                           | Core: [Saved items](saved-items-and-reminders.md); shared pins belong to Channels                                      |
| Directory, profiles, status, typing, presence                        | Identity exists; collaboration behavior incomplete                                         | Core: [Profiles and presence](profiles-and-presence.md)                                                                |
| Standalone web and responsive shell                                  | Shell documented as implemented; new actions absent                                        | Core: [Application shell](application-shell.md)                                                                        |
| Mobile web, keyboard, accessibility, client continuity               | Broader requirements not fully established                                                 | Core: [Clients and accessibility](clients-and-accessibility.md)                                                        |
| Live side-panel messaging and recovery                               | Event-scoped loading/manual Refresh documented                                             | Core target: [Browser extension](browser-extension.md)                                                                 |
| Tasks and lists                                                      | Page-centered proposal, not implemented                                                    | Expansion: [Tasks](tasks.md)                                                                                           |
| Shared notes/canvases and templates                                  | Not specified previously                                                                   | Expansion: [Canvases](canvases.md)                                                                                     |
| Audio/video, screen sharing, recorded clips                          | Not specified previously                                                                   | Expansion: [Calls and clips](calls-and-clips.md)                                                                       |
| Webhooks, bots, integration management, slash actions                | Native adapters are future direction                                                       | Expansion: [Integrations](integrations.md)                                                                             |
| Forms and workflow automation                                        | Excluded from earlier MVP                                                                  | Expansion: [Workflows](workflows-and-automation.md)                                                                    |
| Guests and shared external channels                                  | Excluded from earlier MVP                                                                  | Expansion guests, strategic cross-organization sharing: [External collaboration](guests-and-external-collaboration.md) |
| Migration, import/export                                             | Not specified previously                                                                   | Expansion: [Imports and exports](imports-and-exports.md)                                                               |
| Accounts, roles, invitations                                         | Foundation exists; lifecycle decisions remain                                              | Core: [Accounts](accounts-and-organizations.md)                                                                        |
| Security, retention, audit, enterprise controls                      | Complete operational policies not established                                              | Core lifecycle, strategic enterprise controls: [Administration](administration-and-data-lifecycle.md)                  |
| Workspaces and Teams/user groups                                     | Data foundation exists, not channel permissions                                            | Core optional grouping: [Workspaces and teams](workspaces-and-teams.md)                                                |
| AI summaries, answers, recaps, assistants                            | Not approved                                                                               | Strategic: [AI assistance](ai-assistance.md)                                                                           |
| Billing and commercial rules                                         | Existing owner retained                                                                    | [Billing](billing-and-product-access.md): no new price or offer approved                                               |
| Customer referrals and partnerships                                  | Existing owner retained                                                                    | [Referrals](referrals-and-partnerships.md): unchanged                                                                  |
| Public positioning and availability claims                           | Existing owner retained                                                                    | [Marketing](marketing-site.md): unchanged; proposals are not shipped claims                                            |

## Proposed defaults to review first

Evolve work Chats into the shared channel experience without duplicating history or silently changing existing audiences. Support private channels with explicit membership. Keep DMs separate and ineligible for primary page links.

Ordinary members may create channels; channel managers manage their channels. Retain owner/admin-only page linking initially, with actual destination access required even for administrators. General is a protected organization channel and not a primary page-link destination.

Private-channel invitations disclose access to retained history. Adding people to a group DM creates a new group without importing earlier private history. Public-to-private conversion needs confirmation; initial private-to-public history conversion is excluded.

Authors may edit/delete their own retained messages unless an explicitly disclosed organization policy restricts them. Deletion hides content and retains a tombstone when needed; physical retention is a separate decision.

Prioritize complete everyday communication over calls, canvases, automation, AI, and enterprise administration. Defining an expansion does not require building it in the same change.

Exact upload/storage limits, group/call sizes, retention and recovery periods, notification fallback intervals, supported client versions, and commercial limits remain owner decisions. Do not invent prices or borrow another product's plan limits. Missing required limits block release of the affected capability, not authorize unlimited usage.

## Cross-feature acceptance

A team can work entirely in the web app, find any retained message, and open the same authorized history from a linked page. Private conversations remain private through resolution, search, previews, files, notifications, exports, calls, and later AI. Retries, reconnects, several devices, imports, and multiple page links do not duplicate messages or attention. Membership removal revokes future access without deleting company history.

## Reference sources retained from the feature review

These links support comparison research, not SideWire implementation claims or identical feature defaults. The harness-engineering source is separately attributed in [its reference note](../references/harness-engineering.md). Slack availability and plan limits are not SideWire entitlements.

- [Slack feature catalog](https://slack.com/features)
- [Using Slack help catalog](https://slack.com/help/categories/200111606-Using-Slack)
- [Send and read messages](https://slack.com/help/articles/201457107-Send-and-read-messages)
- [Use threads](https://slack.com/help/articles/115000769927-Use-threads-to-organize-discussions)
- [Search in Slack](https://slack.com/help/articles/202528808-Search-in-Slack)
- [Save messages and files for later](https://slack.com/help/articles/360042650274-Save-messages-and-files-for-later)
- [Use huddles](https://slack.com/help/articles/4402059015315-Use-huddles-in-Slack)
- [Record audio and video clips](https://slack.com/help/articles/4406235165587-Record-audio-and-video-clips-in-Slack)
- [Use lists](https://slack.com/help/articles/27452748828179-Use-lists-in-Slack)
- [Use a canvas](https://slack.com/help/articles/203950418-Use-a-canvas-in-Slack)
- [Workflow automation](https://slack.com/features/workflow-automation)
- [Enterprise capabilities](https://slack.com/enterprise)
- [Developer tools](https://api.slack.com/tools)
