# Page contexts and Apps grouping

Status: **Draft for owner review. Core target; documented implemented baseline retained below.** Page identity, read-only resolution, and explicit creation were documented as implemented through milestone 5 of `docs/plans/001-page-chats-and-linking.md`; manual Chrome verification remained pending. This review does not certify runtime behavior.

This document owns external-page identity, resolution, safe return links, display metadata, and Apps grouping. [Page linking](page-conversations.md) owns associations and provenance; [Channels](team-conversations.md) owns the proposed expanded audiences.

## Purpose and ownership

A page context identifies an external page or stable record and may route to one durable shared Chat. It belongs to one Organization and its existing default Workspace. An App groups persisted contexts for browsing; it does not own messages or define a tenant, channel, subscription, integration, or permission boundary.

Do not call a context a SideWire project, customer, deal, job, ticket, or channel. It may represent any of those externally. The web app remains useful with zero contexts and zero installed extensions.

## Resolution and deliberate persistence

After intentional SideWire invocation, the extension may submit the active supported tab's URL, browser-provided title, and optional favicon. The server validates safety, computes a versioned identity, and performs an organization/default-workspace-scoped lookup. Resolution is read-only. An unknown page produces only a validated ephemeral descriptor, not a stored context, request-key record, subscription, browsing event, Apps entry, search result, or notification.

Persist context data only through explicit **Create chat for this page** or authorized **Link to existing chat**. The server repeats normalization, safety, active-membership, destination, and scope checks inside that mutation. Client descriptors are not authority. Concurrent creates/links must converge on one context with at most one primary chat, or return a safe conflict without overwriting another result.

The same deliberate workflow may be offered in the web app through a manually supplied safe URL. No extension, DOM access, or provider connection is required for a user to add a known source link. Sending a message, editing a form, opening a page, or writing a draft never implicitly creates a context or association.

Do not restore the removed `page_context_resolution_keys` table or replace it with another durable visit log. Explicit creation/linking and message commands retain their own safe retry guarantees without logging passive resolution.

## Conservative identity and URL safety

Normalize scheme/host consistently; preserve paths and unknown query parameters unless an approved rule proves equivalence. Remove only recognized tracking parameters. Fragment removal must not erase record identity in an unsupported hash-routed application: report the unsupported case instead of pretending several records are the same.

Reject unsafe schemes and known credential-bearing, temporary access, signing-session, and sensitive token URLs before persistence. Do not strip a token and assume the remainder is a valid canonical record. Ask for a stable safe source link. Rejected raw URLs must not enter records, message provenance, analytics, routine logs, or preview requests.

Titles and favicons are display hints, never identity or authorization. Matching titles/customer names cannot justify merging records. Do not read page bodies, cookies, forms, canonical DOM elements, or application state. Version identity behavior and preserve regression cases; changing normalization must not silently move existing chats.

Persist only an opaque identifier, organization/workspace ownership, normalized identity/version, safe source URL, validated source host or approved platform key, safe label/title, optional safe favicon reference, creator, and necessary lifecycle information. Favicon rendering must not expose sensitive source URLs to unapproved third-party services.

## Private destinations and Apps

With private channels, resolution and all context/Apps queries must enforce current destination access before exposing saved titles, URLs, labels, associations, counts, or chat existence. Knowing an external URL is not a SideWire access grant. A user who cannot access a linked destination must not overwrite its mapping by treating it as an empty public page. Return a neutral unavailable/conflict result without naming the hidden channel or members.

Use validated normalized source host as the conservative Apps grouping fallback. Only an approved platform rule may group host aliases or apply friendly labels. Do not collapse unrelated subdomains or external-account namespaces simply because they share a registrable domain.

Apps counts and filters include only authorized persisted collaboration data. One chat linked to two apps appears once in combined chat results. Context results may remain distinct. Current-link filters and historical message-source filters must be labeled differently; neither changes message provenance.

## Recognition versus linking

Recognition asks whether URLs represent the same external record. Linking asks whether distinct records should open the same discussion. Several exact contexts can share one chat without claiming their external records are identical. A merely related reference can be pasted as a normal message link instead.

Application-specific adapters, user-defined normalization, aliases, context merge/split, canonical-link extraction, site-wide contexts, and route templates remain separate future decisions. This Slack-oriented review does not approve automatic customer matching or broader browser permissions.

## Acceptance behavior

Repeated authorized resolution of an unrecognized page creates no persistent data. Explicit concurrent creation/linking cannot duplicate identity or primary association. Unsafe URLs fail before storage. Distinct records stay distinct even when sharing a chat. A private destination cannot leak through Apps, URL lookup, counts, search, or creation errors. Direct web communication requires no page. Changing a page link never changes historical message attribution.

## Implementation map — documented baseline only

- Extension routes: `POST /api/v1/extension/page-contexts/resolve`, `POST /api/v1/extension/page-chats`, and `GET /api/v1/extension/page-contexts/{pageContext}`.
- Extension client: `apps/extension/src/page-chat/api.ts`.
- Domain entry points: `app/Domain/PageContexts/ResolvePageContext.php`, `CreatePageContext.php`, and `NormalizePageUrl.php`.
- Model/table: `app/Models/PageContext.php`, `page_contexts`; migration `database/migrations/2026_09_05_140000_drop_page_context_resolution_keys.php`.
- Presentation/discovery: `app/Http/Resources/PageContextResource.php`, `app/Domain/Activity/ConversationDiscovery.php`.
- Existing tests: `tests/Feature/PageContexts/`.

These paths do not imply that private-channel filtering or manual web linking is already implemented. Related owners: [Browser extension](browser-extension.md), [Page linking](page-conversations.md), [Search](search.md).
