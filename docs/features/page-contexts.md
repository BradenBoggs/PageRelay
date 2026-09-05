# Page contexts and Apps grouping

Status: implemented through milestone 5 of `docs/plans/001-page-chats-and-linking.md`; manual Chrome verification remains pending.

This document owns external-page identity, resolution, safe return links, display metadata, and Apps grouping. `page-conversations.md` owns chats and page-to-chat linking. Tasks retain their own scope and are not moved or combined by linking chats.

## Purpose and ownership

A page context identifies the external page or stable record where work is happening. It belongs to one organization and, under the existing MVP foundation, its default workspace. An App groups contexts for discovery; it does not own their messages or define a new tenant.

Do not call a context a project, customer, deal, channel, job, or ticket. It may represent any of those depending on the source application.

## Universal resolution

After an intentional SideWire interaction, the extension may send the active supported page's URL, browser-provided title, and optional favicon URL. The server validates the metadata and URL safety, computes a versioned normalized identity, and performs an organization/default-workspace-scoped lookup. Resolution is read-only: visiting or resolving a page with no existing context must not create a `page_contexts` record or any durable idempotency record.

When the normalized identity already has a context, resolution returns that context and its current chat, if any. Otherwise it returns a validated ephemeral page descriptor that lets the interface show **No chat yet** without persisting the URL, title, favicon, or browsing event. Different organizations continue to receive isolated lookup results.

Persist the context only when the user explicitly submits **Create chat for this page** or an eligible manager links the page to an existing chat. Sending a message is available only after a chat exists and must not implicitly create a context or chat. The server must repeat normalization, safety validation, active-membership checks, and organization/default-workspace scoping inside the create/link transaction; the ephemeral client descriptor and editable form values are not trusted authority. The normalized-identity unique constraint and transactional command rules must make concurrent creates and links converge on one context.

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

A general reference, reusable template, or merely related page can be shared as an ordinary message link without joining the shared chat.

## Later identity improvements

Application-specific adapters may recognize stable record IDs or discard volatile routing parameters for approved services. They must not make the universal safe-URL path dependent on native integrations.

Manual context merge/split, identity aliases, organization-defined normalization, canonical-link reading, site-wide contexts, and route templates require separate approval. They are not implicitly approved by manual page-to-chat linking. Any later identity merge must preserve history, links, unread state, and an auditable recovery path.

## Privacy and isolation

URLs and titles may contain customer or workplace information. Treat them as private organization data, exclude sensitive values from routine logs and analytics, and never reveal cross-organization existence. Do not persist unsupported pages, visit-only pages, or background tabs merely because the browser navigated.

SideWire does not infer or enforce an external app's permissions simply by recognizing its URL. Access to contexts and chats comes from SideWire's own approved membership and chat policies.

## Acceptance behavior

Two authorized members resolving the same supported page reach the same persisted context when collaboration exists and otherwise receive equivalent isolated ephemeral descriptors. Different records stay distinct even when sharing a chat. Apps grouping neither combines their identities nor fragments the shared history. Another organization cannot discover the context, App counts, chat association, title, or URL. Unsafe source links fail before persistence. Resolving a page with no existing context creates no database record, visible discussion, Apps entry, or company-wide activity. Submitting the creation form persists one context and one empty chat without sending a message. Concurrent creates or links converge on one context, and retrying create, link, or message commands does not duplicate a context, chat, message, or association.

## Implementation map

Primary entry points:

- Extension API: lookup through `POST /api/v1/extension/page-contexts/resolve`, explicit creation through `POST /api/v1/extension/page-chats`, and persisted-context reads through `GET /api/v1/extension/page-contexts/{pageContext}`
- Extension client: `apps/extension/src/page-chat/api.ts`
- Domain services: `app/Domain/PageContexts/ResolvePageContext.php`, `CreatePageContext.php`, and `NormalizePageUrl.php`
- Persistent model/table: `app/Models/PageContext.php` and `page_contexts`; `database/migrations/2026_09_05_140000_drop_page_context_resolution_keys.php` removes the former visit-request key table
- API presentation: `app/Http/Resources/PageContextResource.php`
- Apps discovery/filter query: `app/Domain/Activity/ConversationDiscovery.php`
- Tests: `tests/Feature/PageContexts/`

Related specifications:

- `docs/features/browser-extension.md`
- `docs/features/page-conversations.md`
