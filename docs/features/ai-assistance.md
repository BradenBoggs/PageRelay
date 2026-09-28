# Optional AI assistance and source-backed answers

Status: **Draft for owner review. Strategic target; not established as implemented.** AI is not required for channels, DMs, page context, or ordinary search. No provider, model, commercial allowance, or automatic action is approved by this document. See [review scope](README.md).

This document owns optional summaries, recaps, answers, drafting assistance, and AI-specific privacy/approval controls. Source ingestion belongs to Search/Integrations; external writes and automation retain their normal authorization.

## Candidate user outcomes

Useful bounded capabilities include summarizing an authorized channel/thread, recapping unread discussion, answering a question with inspectable message references, and drafting a reply or task for the user to review. A summary must show its scope and source cutoff, distinguish uncertain conclusions, and link to supporting retained content. It must not claim to have read an external page just because SideWire knows its URL/title.

The official Slack updates consulted for this review also describe research agents, reusable skills, coding-agent channels, and generated work surfaces. These are comparison areas, not SideWire requirements to build a coding environment, CRM, or general autonomous-agent platform. SideWire's proposed initial AI scope remains assistance over explicitly authorized collaboration content.

## Permissions and provenance

An assistant acts within the requesting user's current source access and the destination's audience. Organization-level enablement is not permission to read every private channel or DM. Each retrieved source, quote, file, answer, cache, and generated attachment must respect current access. Stale indexes or cached summaries cannot bypass revoked membership.

Posting a summary into a broader audience requires checking that the underlying information can be disclosed there. If it draws from private sources not available to that audience, keep it private and explain the conflict; do not automatically convert it into a public channel post. Permission-safe links alone do not sanitize text already copied into a summary.

Source documents/messages are untrusted data, not instructions to expand permissions or execute actions. A pasted instruction inside a page, file, or chat cannot authorize tool use, disclosure, or a workflow. Generated suggestions are clearly differentiated from human decisions and external-provider records.

## Actions and user control

Drafting is distinct from sending. Creating/assigning a task, inviting someone, changing a channel, editing a provider record, or executing a workflow requires explicit scope and confirmation under the owning feature. An AI action must not impersonate an unconsenting author or silently use an administrator's broader credentials.

Users can decline, edit, regenerate, or report an answer. Unavailable sources and insufficient evidence produce an honest limitation, not fabricated citations. A source deletion/access change must invalidate affected cached answers before reuse; retained derived content needs the same explicit retention/disclosure policy as its sources.

## Provider and administration

An owner must approve enabling AI, the specific provider/model, data sent, processing/retention/training terms, region where applicable, and costs. Do not promise that a provider never retains or trains on data without verified contractual support. Offer clear disable controls and respect conversation/resource exclusions where supported.

Record minimal auditable action metadata without copying private prompts/responses into routine logs. Usage limits and failures preserve the ordinary chat workflow; an AI outage cannot prevent sending messages or searching conventional results. External web research, connected-system enterprise search, recordings/transcripts, and agent/tool protocols need their own consent and scope.

## Acceptance behavior and decisions

A summary cites the actual authorized discussion and accurately states its cutoff. A private-source answer cannot leak into a public destination or survive access revocation through stale cache. Embedded instructions do not expand tool authority. Proposed side effects require confirmation and reuse normal permission checks. Disabling AI leaves core communication usable.

Owner decisions: whether AI is needed, first use case, provider terms, eligible data, retained outputs, costs, and action permissions. Automatic company-wide monitoring, employee evaluation, autonomous administration, and a built-in coding/CRM platform are excluded.

Reference coverage: [Slack feature catalog](https://slack.com/features) and [Slack's current product updates, consulted September 27, 2026](https://slack.com/whats-new). SideWire's narrower choices are review proposals.
