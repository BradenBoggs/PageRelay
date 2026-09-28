# SideWire feature review: everyday team communication plus page context

Status: **DRAFT FOR OWNER REVIEW — September 27, 2026.** This is a documentation-only proposal, not approval to implement, a release commitment, or a claim of Slack feature parity.

Reviewed baseline: `main` at `f7c7212ae12f1453daea5df7b26d11f0e503b02b`. All 16 existing feature documents were reviewed. Existing implementation statements below come from those documents, not a new code audit or test run. In particular, manual Chrome verification was still pending. No execution plan or application code is changed by this review.

## Product direction

SideWire should support a team's everyday communication as a complete web application, with an optional Chrome side panel that brings the same conversations beside the pages where work happens. Installing the extension, having a source URL, or connecting an external service must not be necessary to create a channel, send a DM, search, or catch up.

Page context is an additional entry point and useful message provenance, not the owner of conversation history. One chat may have many linked pages; one page context has at most one current primary chat. Ordinary web messages have no inferred browser-page source. Links never import external messages, merge histories, or grant access.

Keep Organization as the tenant and billing boundary, the existing default Workspace, authoritative organization memberships, and Teams as reusable groups of people. Apps remains an optional source-site filter, especially useful in the extension, not the web application's primary organizing requirement. This review does not approve organization/workspace switching, a workspace per domain, a Project model, or a rename-only migration.

## How to read the specifications

Each changed feature identifies the documented baseline separately from its proposed target. **Core** means recommended for a credible everyday communication product; it does not mean already built or that every item must be released together. **Expansion** means a defined capability to review separately. **Strategic** means a larger product/security commitment, not a launch dependency. These labels describe product scope, not implementation phases or task sequences.

Feature documents own behavior and acceptance criteria. Existing implementation maps identify current entry points only. New capabilities intentionally have no invented implementation maps, schema designs, execution steps, or test-result claims.

`docs/PRODUCT.md`, `docs/UI.md`, `docs/ARCHITECTURE.md`, `AGENTS.md`, and existing plans retain the previously approved narrower scope. Where they defer channels, replies, rich messages, notification delivery, or extension realtime, that describes the approved baseline. The new target sections here are review proposals, not silent changes to those approvals. Owner acceptance must be followed by narrowly aligning those owning overview documents before implementation is authorized; historical plans must not be rewritten as if these features already shipped.

## Coverage and ownership

| Capability | Documented baseline / gap | Proposed scope and owning specification |
| --- | --- | --- |
| Page identity, explicit creation, cross-app linking | Implemented; retain conservative identity, no visit logging, no nonempty-history merge | Core: [Page contexts](page-contexts.md), [Page linking](page-conversations.md) |
| Public/private channels, General, membership, archive, announcements | Named organization-wide work Chats exist; separate audiences and administration deferred | Core: [Channels](team-conversations.md) |
| One-to-one and group DMs, notes to self | One-to-one planned; group DMs deferred | Core: [Direct messages](direct-messages.md) |
| Rich messages, reactions, edit/delete, permalinks, complete history | Plain text; web shell documents a latest-100-message limit | Core: [Messaging](messaging-and-composer.md) |
| Replies, followed threads, thread unread state | Deferred | Core: [Threads](threads.md) |
| Attachments, file previews, snippets, safe link previews | Deferred | Core files; preview expansion: [Files and links](files-and-links.md) |
| Activity, unread, following, mark unread | Minimal work-Chat discovery and monotonic read state implemented | Core: [Activity](inbox-and-unread.md) |
| Mentions, desktop alerts, preferences, quiet hours | Proposed in-product mentions; external delivery deferred | Core controls and supported desktop delivery: [Notifications](mentions-and-notifications.md) |
| Full-history search, filters, people/files/replies | Basic chat discovery search exists; full search proposed | Core: [Search](search.md) |
| Durable drafts and scheduled send | In-memory web drafts only | Core drafts; expansion scheduled send: [Drafts and scheduling](drafts-and-scheduled-messages.md) |
| Saved items, reminders, favorites, shared pins | Not specified as complete features | Core: [Saved items](saved-items-and-reminders.md); shared resources owned by Channels |
| Profiles, status, typing, presence, people directory | Authentication identity exists; collaboration behavior incomplete | Core: [Profiles and presence](profiles-and-presence.md) |
| Standalone web, responsive mobile, keyboard access | Web shell implemented; many messaging actions absent | Core: [Application shell](application-shell.md), [Clients and accessibility](clients-and-accessibility.md) |
| Live side-panel messaging and recovery | Extension deliberately uses event-scoped loads/manual Refresh | Core target: [Browser extension](browser-extension.md), Messaging |
| Lightweight tasks and lists | Page-centered task proposal; no implementation | Expansion: [Tasks](tasks.md) |
| Shared notes/canvases and templates | Not specified | Expansion: [Canvases](canvases.md) |
| Audio/video, screen sharing, asynchronous clips | Not specified | Expansion: [Calls and clips](calls-and-clips.md) |
| Webhooks, bots, integration management, slash actions | Native adapters are future direction | Expansion: [Integrations](integrations.md) |
| Forms and workflow automation | Excluded from earlier MVP | Expansion: [Workflows](workflows-and-automation.md) |
| Guests and shared external channels | Excluded from earlier MVP | Expansion guests; strategic cross-organization sharing: [External collaboration](guests-and-external-collaboration.md) |
| Import/export and migration from another chat tool | Not specified | Expansion: [Imports and exports](imports-and-exports.md) |
| Account administration, security, retention, audit | Foundation exists; lifecycle decisions remain open | Core lifecycle; strategic enterprise controls: [Accounts](accounts-and-organizations.md), [Administration](administration-and-data-lifecycle.md) |
| Teams/user groups | Data foundation exists; not channel permissions | Core optional grouping: [Workspaces and teams](workspaces-and-teams.md) |
| AI summaries, answers, recaps, assistants | Not approved | Strategic: [AI assistance](ai-assistance.md) |
| Billing, referrals, marketing | Existing documents reviewed | [Billing](billing-and-product-access.md), [Referrals](referrals-and-partnerships.md), and [Marketing](marketing-site.md) are unchanged; no new price, offer, availability claim, or marketing promise is approved |

Slack's catalog also includes enterprise search across connected systems, agent/developer tooling, and Salesforce-specific experiences. These are reference coverage, not reasons to turn SideWire into a CRM, mirror every integration, or introduce an AI platform. Enterprise search is bounded in Search/AI; extensibility in Integrations. Native desktop/mobile apps and multi-organization switching are strategic options, not implied by a responsive web app.

## Proposed defaults to review first

- **Channel model:** evolve existing work Chats into the shared channel experience without duplicating their histories or changing existing public audiences silently. Support private channels with explicit membership. Keep DMs separate and ineligible for primary page links.
- **Permissions:** ordinary members may create channels; channel managers manage their channels. Retain owner/admin-only page linking initially, with actual destination access required even for administrators. General is a protected organization channel and not a primary page-link destination.
- **History:** private-channel invitations disclose access to retained history. Adding people to a group DM creates a new private group without importing its prior history. Public-to-private channel conversion needs explicit confirmation; private-to-public history conversion is not included initially.
- **Message controls:** authors may edit/delete their own messages while retained, unless an explicitly disclosed organization policy restricts this. Deletion hides content and preserves a tombstone when needed for replies; physical retention is a separate policy decision.
- **Scope:** prioritize the complete communication experience over calls, canvases, automation, AI, and enterprise administration. Define those expansions now without treating them as one build.

Exact upload/storage limits, group/call sizes, retention and recovery periods, notification fallback intervals, supported client versions, and commercial limits remain owner decisions in the owning files. Do not invent prices or borrow Slack plan limits. Lack of a configured limit is a release blocker for the affected feature, not permission for unlimited usage.

## Cross-feature acceptance

A team must be able to communicate entirely in the web app, return to any retained message, and use a linked page to open that same authorized history. A private channel must remain private through page resolution, search, previews, files, notifications, exports, calls, and any later AI feature. Reconnects, multiple devices, several linked pages, imports, and retries must not duplicate messages or attention events. Membership removal must revoke future access without deleting the organization's collaboration history.

This review defines desired behavior; implementation, browser validation, security review, and release readiness remain separate work.

## Slack reference sources

Official pages consulted September 27, 2026. Sources establish Slack's feature coverage, not identical defaults or an endorsement of SideWire. SideWire behavior above is a proposed design. Feature availability can vary by Slack plan; this review does not reproduce its pricing or entitlements.

- [S01 — Slack feature catalog](https://slack.com/features)
- [S02 — Using Slack help catalog: channels, DMs, messaging, notifications, profiles, files, and accessibility](https://slack.com/help/categories/200111606-Using-Slack)
- [S03 — Send and read messages](https://slack.com/help/articles/201457107-Send-and-read-messages)
- [S04 — Use threads](https://slack.com/help/articles/115000769927-Use-threads-to-organize-discussions)
- [S05 — Search in Slack](https://slack.com/help/articles/202528808-Search-in-Slack)
- [S06 — Save messages and files for later](https://slack.com/help/articles/360042650274-Save-messages-and-files-for-later)
- [S07 — Use huddles](https://slack.com/help/articles/4402059015315-Use-huddles-in-Slack)
- [S08 — Record audio and video clips](https://slack.com/help/articles/4406235165587-Record-audio-and-video-clips-in-Slack)
- [S09 — Use lists](https://slack.com/help/articles/27452748828179-Use-lists-in-Slack)
- [S10 — Use a canvas](https://slack.com/help/articles/203950418-Use-a-canvas-in-Slack)
- [S11 — Workflow automation](https://slack.com/features/workflow-automation)
- [S12 — Enterprise capabilities](https://slack.com/enterprise)
- [S13 — Developer tools](https://api.slack.com/tools)
