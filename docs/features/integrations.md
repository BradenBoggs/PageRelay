# Integrations, webhooks, bots, and developer extensibility

Status: **Draft for owner review. Expansion target.** The baseline defines future native integrations; universal safe-URL collaboration must work without them. See [review scope](README.md).

This document owns provider connections, URL/display adapters, scoped app actions, inbound/outbound events, and bot identity. Automation composition belongs to [Workflows](workflows-and-automation.md), AI behavior to [AI assistance](ai-assistance.md), and commercial referrals to their existing document.

## Connection levels

Choose the smallest capability that solves a demonstrated need: an approved URL adapter for stable identity; a safe display adapter; a native deep link; a selected provider event/import; or explicitly authorized write-back. Bidirectional synchronization is not implied by attaching a URL.

Retain universal fallback where safe if an integration is unavailable. Label compatibility accurately: works alongside a website, enhanced by a native integration, or planned/unavailable. Naming Canva, a CRM, or another product is not an integration or partnership claim.

## Installation and identity

An Organization owner/administrator approves organization-level apps and their scopes under the proposed default. A user may connect a personal provider account only when organization policy allows it and the scope is explained. Show who owns the connection, which resources it can access, and how to disconnect. Store provider credentials only through an approved secure server-side boundary, never in host-page scripts or public client configuration.

Bots/apps have visible identities and defined scopes; they cannot impersonate a human author or read all private chats because an administrator installed them. Posting into a private destination requires actual app authorization there. Adding a bot to a private channel must show what retained content it can read. Service identities are not automatically billable human seats; commercial rules remain undecided in Billing.

## Events and actions

An incoming webhook posts only to its approved destination, with authenticated delivery, validation, rate limits, and replay-safe event identity. Outgoing subscriptions send only explicitly selected eligible events and fields. Use provider signature verification where available, scoped credentials, safe retries, and revocable secrets. Deleting a connection stops queued deliveries and future access.

Recheck current conversation access, archive/posting restrictions, and provider permission before each action. An app cannot use a stale authorization snapshot to export private content or post as a removed user. External-call failures are visible without exposing credentials or full sensitive payloads in logs.

Slash commands, message shortcuts, and contextual actions display the destination and material side effects before execution. A harmless text command must not become an unconfirmed destructive action. Provider-returned content is untrusted and rendered safely. Webhook targets and preview requests need safe-network boundaries rather than arbitrary server access.

## Synchronization boundaries

Import/event messages must visibly identify their provider and original provenance; they are not labeled as human messages sent while viewing a page. Map external event identities without duplicating messages through retries or cross-app links. Define edits, deletion, conflict ownership, and loop prevention before enabling two-way comments or updates.

Calendar-derived status, external file references, issue/task updates, and curated app connectors are independent optional integrations. Do not build a full marketplace or thousands of adapters as a prerequisite. Agent/tool protocols are a strategic extension of these scoped permissions, not a route around them. Arbitrary hosted code execution and a coding-agent workspace are outside this proposal.

## Acceptance behavior and decisions

Installation shows scope and ownership; a restricted bot cannot discover other private content. Replayed events produce one result. Disconnect, member removal, channel archive, and provider failure stop unauthorized queued work and retain honest status. URL-only collaboration continues independently.

Owner decisions: first provider/use case, installer roles, approved event payloads, bot-history access, connector costs, and write-back consent. Review provider terms and data obligations before production; no native connection is authorized by this document alone.

Reference coverage: [Slack developer tools](https://docs.slack.dev/tools/), [Slack feature catalog](https://slack.com/features). These establish comparison areas, not an obligation to copy Slack's integration platform.
