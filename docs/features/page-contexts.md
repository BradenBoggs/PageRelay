# Page contexts and Apps grouping

Status: approved MVP product direction; not implemented. Implementation planning is tracked in `docs/plans/001-page-chats-and-linking.md` and does not itself authorize application changes.

This document owns external-page identity, resolution, safe return links, display metadata, and Apps grouping. `page-conversations.md` owns chats and page-to-chat linking. Tasks retain their own scope and are not moved or combined by linking chats.

## Purpose and ownership

A page context identifies the external page or stable record where work is happening. It belongs to one organization and, under the existing MVP foundation, its default workspace. An App groups contexts for discovery; it does not own their messages or define a new tenant.

Do not call a context a project, customer, deal, channel, job, or ticket. It may represent any of those depending on the source application.

## Universal resolution

After an intentional SideWire interaction, the extension may send the active supported page's URL, browser-provided title, optional favicon URL, and an idempotency key. The server validates the metadata and URL safety before persistence, computes a versioned normalized identity, and finds or creates the private context through the authenticated organization and its default workspace.

Repeated resolution of the same organization, default workspace, and normalized identity returns the same active context. Different organizations viewing the same URL receive separate private contexts.

Resolution may persist a context, but ordinary navigation or resolution alone must not create a visible chat, send notifications, subscribe organization members, import every record in the external app, or populate a giant channel list. Chat creation and explicit linking follow `page-conversations.md`.

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

A context includes an opaque public identifier, organization, workspace, safe source URL, normalized identity, normalization version, source host or approved platform key, safe display title or explicit user label, optional favicon reference, creator, and timestamps. A current primary chat association is optional and follows `page-conversations.md`.

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

URLs and titles may contain customer or workplace information. Treat them as private organization data, exclude sensitive values from routine logs and analytics, and never reveal cross-organization existence. Do not persist unsupported pages or resolve background tabs merely because the browser navigated.

SideWire does not infer or enforce an external app's permissions simply by recognizing its URL. Access to contexts and chats comes from SideWire's own approved membership and chat policies.

## Acceptance behavior

Two authorized members resolving the same supported page reach the same context. Different records stay distinct even when sharing a chat. Apps grouping neither combines their identities nor fragments the shared history. Another organization cannot discover the context, App counts, chat association, title, or URL. Unsafe source links fail before persistence. Resolving a page with no chat does not create a visible discussion or company-wide activity.
