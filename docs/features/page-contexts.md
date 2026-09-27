# Page contexts and Apps grouping

Status: baseline implemented by plan 001; explicitly selected per-context URL scopes are implemented by `docs/plans/004-url-match-selector.md`. See that plan for actual verification and remaining live Chrome checks.

This document owns external-page identity, resolution, safe return links, display metadata, and Apps grouping. `page-conversations.md` owns chats and page-to-chat linking. Tasks retain their own scope and are not moved or combined by linking chats.

## Purpose and ownership

A page context identifies an external page or stable record and can route that page into a durable work Chat. It belongs to one organization and, under the existing MVP foundation, its default workspace. An App groups contexts for discovery; it does not own their messages or define a new tenant.

Do not call a context a project, customer, deal, channel, job, or ticket. It may represent any of those depending on the source application.

## Universal resolution

After an intentional SideWire interaction, the extension may send the active supported page's URL, browser-provided title, and optional favicon URL. The server validates the metadata and URL safety, computes a versioned normalized identity, and performs an organization/default-workspace-scoped lookup. Resolution is read-only: visiting or resolving a page with no existing context must not create a `page_contexts` record or any durable idempotency record.

Resolution checks the legacy exact identity and saved literal URL scopes inside the same organization/default workspace. One matching context returns its current Chat, if any; multiple matches fail closed as a conflict. Otherwise it returns a validated ephemeral page descriptor that lets the interface offer creation or linking without persisting the URL, title, favicon, or browsing event. Different organizations continue to receive isolated lookup results.

Persist the context only when the user explicitly submits **Create chat for this page** or an eligible manager links the page to an existing work Chat. A named work Chat may already exist independently of any context. Sending from This Page is available only after a Chat is linked and must not implicitly create a context or Chat. The server must repeat normalization, safety validation, active-membership checks, and organization/default-workspace scoping inside the create/link transaction; the ephemeral client descriptor and editable form values are not trusted authority. The normalized-identity unique constraint and transactional command rules must make concurrent creates and links converge on one context.

Read-only resolution does not require a client idempotency key. Remove the `page_context_resolution_keys` table and do not replace it with another durable visit log. Explicit chat creation is naturally repeatable through the normalized-identity and one-chat-per-context constraints, message sends keep their existing message idempotency key, and linking remains repeatable when the same normalized page identity is already attached to the requested destination. Conflicting concurrent actions return the existing stale/conflict recovery response.

Ordinary navigation, resolution, or draft entry alone must not create a visible chat, send notifications, subscribe organization members, import external records, populate Apps, or create persistent records. Manual chat creation and explicit linking follow `page-conversations.md`.

## Conservative normalization and safe URLs

The universal normalizer should:

- normalize scheme and host consistently;
- remove in-page fragments under the approved normalization rules; do not treat an unsupported fragment-routed application as safely recognized when that would erase record identity;
- remove only explicitly recognized tracking parameters;
- preserve path and unknown query parameters for otherwise safe URLs;
- reject unsafe or unsupported schemes and known credential-bearing, temporary access, or signing-session URLs;
- version its behavior and cover rules with regression tests.

Safety validation is separate from normalization. Do not strip an access token from an unsafe URL and assume the remainder identifies the correct record. Require a supported stable source link instead. Do not persist rejected raw URLs in context records, message provenance, analytics, or routine logs.

Titles and favicons are display metadata, never identity or authorization inputs. Do not merge pages because their titles or customer names resemble one another. Do not read host cookies, page bodies, or application state to solve identity ambiguity.

## Context information

A persisted context includes an opaque public identifier, organization, workspace, safe source URL, normalized identity, normalization version, source host or approved platform key, safe display title or explicit user label, optional favicon reference, creator, and timestamps. A current primary chat association is optional and follows `page-conversations.md`. An ephemeral descriptor returned before collaboration is not a context record and must not appear in Apps, Chats, Activity, search, analytics, or organization data exports.

Store only the minimum safe display metadata. Track collaboration activity without turning ordinary browsing into surveillance. Validate source URLs before opening or copying them; long raw URLs should not be the primary visible label.

## Apps grouping

The interface labels the collection Apps even when an entry represents a website rather than a formal business application. Examples are Supermove and Docusign, each with its own recognized page contexts.

Use the validated normalized source host as the conservative grouping fallback. A separately approved platform rule may provide a friendly app label or group recognized host aliases. Do not collapse unrelated subdomains or external account namespaces merely because they share a registrable root domain. App grouping must never change context identity.

Apps is an organization-scoped browsing/filtering aid, not an external-account connection, workspace selector, authorization rule, subscription, or channel. A grouping can be derived from context metadata; this specification does not require a new App model or table.

A chat linked to contexts from several apps is one chat discoverable through each applicable App group, not a copy in each group. Activity and search own their deduplication and result behavior. App groups and counts reveal only authorized SideWire data, not an inventory of everything in the external service.

## Recognition versus chat linking

URL recognition asks whether different URLs represent the same external record; proven equivalents resolve to one context under approved normalization rules.

Chat linking asks whether distinct external records should share their SideWire discussion. A Supermove project and its Docusign agreement remain two contexts even when both open the same chat. Linking does not rewrite either normalized identity or declare their business records equivalent.

Correct page routing does not require SideWire to infer every external application's complete URL model. Several exact or separately normalized contexts may route to one Chat. Conservative candidate suggestions and explicit linking can deliver the correct Chat while application-specific identity rules remain incomplete.

A general reference, reusable template, or merely related page can be shared as an ordinary message link without joining the shared chat.

## Segmented URL selector and literal scopes

The user explicitly approved per-record URL scope selection on September 26, 2026. This is not an automatic CRM adapter or organization-wide route template. The literal identifier selected for one record never becomes a wildcard for all records.

Use one shared React control in the extension’s Create chat and Link/Matching dialog, and in the web chat header’s Link Page and per-link Matching dialogs. Web users paste a URL, review the current server mapping, select a scope, and explicitly save. Extension creation starts with the active tab URL in its original path/query order. Editing that URL resets the unsaved selection to exact and clears the prior mapping revision. Existing matching is edited from the saved representative link.

Start with **Use exact page**: all non-tracking query parameters and the full path participate under the existing universal normalizer. Ordinary anchors remain ignored; fragment routes remain unsupported. A user can select a path endpoint; all path segments through it form a literal prefix. Hover and keyboard focus preview the cumulative highlight. Clicking, Enter, or Space commits the local selection. Hovering/focusing never changes the committed scope, and none of these interactions persist data. Only Create chat or Link to chat saves.

Query chips are independent from the path prefix. Select by decoded parameter name; every value for that name participates. Parameter and duplicate-value order are immaterial, duplicate multiplicity and key/value case are significant. A missing selected name is invalid; a candidate missing a required name or containing different values does not match. Tracking parameters are not eligible. Percent-encoded separators remain inside their parsed component rather than becoming extra path/query sections.

Selected path boundaries are exact: `/records/123` matches itself and `/records/123/view`, not `/records/1234`. The exact normalized origin, including scheme and non-default port, must match. Unknown path encodings are not guessed equivalent. The selector does not identify customer names, tenants, or record types semantically. Users must retain account/tenant identifiers where the external URL needs them.

Show the committed matching address as text, not an assumed working link. Explain that the selected path includes its subpages, selected query values are required, and muted sections are **ignored for matching**, not deleted from message sources. A path with fewer than two sections and no required query parameter requires explicit broad-scope confirmation on the client and server. This is a conservative warning heuristic, not proof that a deeper path uniquely identifies a record.

Example supplied by the user: selecting the project-ID section of the Supermove `/projects/{literal-id}/view?block=STOPS&jobUuid=...` URL stores that exact project path with no required query values. Its views resolve to one context; a different project ID does not. This is a user-configured link, not verified native Supermove integration.

## Storage, conflicts, and change protection

Store a nullable `url_match` JSON definition on the existing context. Null retains legacy exact behavior. Version 1 stores exact origin, literal path prefix, selected path depth, and sorted required query groups. Keep the existing normalized identity, representative safe URL, context ID, and messages unchanged. Resolution returns the current safe `view_url` separately from the representative `url`; looking up another view does not write a context or visit log.

Owners/admins may link an existing Chat or change an existing scope. Members retain explicit new page-chat creation. Mutation-time membership checks and the existing default-workspace lock serialize scope writes with legacy context creation; context and association locks continue to guard relinking and sends. New/changed scopes are checked against other contexts on the same source host inside the same tenant/workspace. Reject overlaps, including compatible query constraints with different example URLs, even if two contexts currently share a Chat. Do not choose longest-prefix priority, automatically absorb contexts, or merge histories. Exact entries participate in these collision checks. Corrupt/ambiguous multiple matches fail closed.

Changing an existing scope requires the reviewed context public ID and association revision. Increment that revision on a scope change so old drafts cannot silently acquire a new routing interpretation. Retrying an identical saved scope and association is idempotent. A changed scope must still include the original representative URL; edit from that original link to restore exact matching. All mutations are transactional and unsuccessful changes leave the prior context, Chat, and history intact. Mapping audit events store actor/context identifiers, not raw URLs or message bodies.

Validate the full source URL before creating a scope, including every ignored query parameter. Known credential/signing URLs and unsupported fragments still fail. Reject malformed percent escapes, control characters, backslashes, and dot-path segments rather than allowing differences between browser URL parsing and server parsing to silently widen matching. This does not claim exhaustive recognition of every vendor’s secret-bearing URL format. Routine logs must not retain submitted URL values.

## Later identity improvements

Organization-wide route templates, automatic platform recognition, context merge/split, identity aliases, canonical-link reading, and fragment-route support remain deferred. The explicit literal scopes above do not authorize these features. A CRM that shows distinct records at the same URL still requires manual chat selection or a future separately approved integration.

## Privacy and isolation

URLs and titles may contain customer or workplace information. Treat them as private organization data, exclude sensitive values from routine logs and analytics, and never reveal cross-organization existence. Do not persist unsupported pages, visit-only pages, or background tabs merely because the browser navigated.

SideWire does not infer or enforce an external app's permissions simply by recognizing its URL. Access to contexts and chats comes from SideWire's own approved membership and chat policies.

## Acceptance behavior

Two authorized members resolving the same supported page reach the same persisted context when collaboration exists and otherwise receive equivalent isolated ephemeral descriptors. Different records stay distinct even when sharing a chat. Apps grouping neither combines their identities nor fragments the shared history. Another organization cannot discover the context, App counts, chat association, title, or URL. Unsafe source links fail before persistence. Resolving a page with no existing context creates no database record, visible discussion, Apps entry, or company-wide activity. Submitting the creation form persists one context and one empty chat without sending a message. Concurrent creates or links converge on one context, and retrying create, link, or message commands does not duplicate a context, chat, message, or association.

## Implementation map

Primary entry points:

- Extension API: lookup through `POST /api/v1/extension/page-contexts/resolve`, explicit creation through `POST /api/v1/extension/page-chats`, and persisted-context reads through `GET /api/v1/extension/page-contexts/{pageContext}`
- Extension client: `apps/extension/src/page-chat/api.ts`
- Domain services: `app/Domain/PageContexts/ResolvePageContext.php`, `CreatePageContext.php`, `NormalizePageUrl.php`, `PageUrlMatch.php`, and `SavePageLink.php`
- Shared selector: `packages/page-contexts/`; web adapter: `resources/js/components/chats/link-page-dialog.tsx`; extension adapter: `apps/extension/src/sidepanel/main.tsx`
- Scope endpoints: `POST /page-links/preview` and `POST /page-links` (web); equivalent `/api/v1/extension/page-links` routes; `app/Http/Controllers/PageLinkController.php`
- Additive schema: `database/migrations/2026_09_26_160000_add_page_url_matching.php`
- Persistent model/table: `app/Models/PageContext.php` and `page_contexts`; `database/migrations/2026_09_05_140000_drop_page_context_resolution_keys.php` removes the former visit-request key table
- API presentation: `app/Http/Resources/PageContextResource.php`
- Apps discovery/filter query: `app/Domain/Activity/ConversationDiscovery.php`
- Tests: `tests/Feature/PageContexts/`, `tests/frontend/url-selection.test.mjs`, and `tests/browser/url-selector.cjs`

Related specifications:

- `docs/features/browser-extension.md`
- `docs/features/page-conversations.md`
