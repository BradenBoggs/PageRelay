# Channels and organization-wide communication

Status: **Draft for owner review. Core target.** The documented baseline provides named organization-wide work Chats; the default organization Chat and Slack-style membership/administration were not implemented by this feature. This proposal does not claim otherwise. See [review scope](README.md).

This document owns channel audience, membership, discovery, management, archive, posting restrictions, and shared channel resources. [Messaging](messaging-and-composer.md) owns messages; [page linking](page-conversations.md) owns page associations. The legacy filename and internal `Conversation` names remain valid.

## Purpose and model

A channel is a durable shared Chat for a topic, team, project, customer, or other work, whether or not any external page is linked. It belongs to the Organization and existing default Workspace, not to an App or Team. Channels and DMs use shared messaging behavior but different access policies.

The proposed channel experience evolves existing work Chats rather than creating a second parallel history system. Existing identifiers, links, authors, and read positions must survive adoption. Existing organization-wide work Chats remain organization-visible unless an authorized person deliberately restricts them. Merely approving this document does not prescribe a schema migration or silently enroll everyone in notifications.

## Creation and visibility

Any active full member may create a channel under the proposed default; an organization policy may limit creation. Creation asks for a name, optional description/topic, and public or private visibility. Explain the audience before confirmation. A source URL is optional and never an onboarding requirement.

**Public** means discoverable by active full members inside the organization, not accessible on the internet. They may inspect retained public history and explicitly join to participate. Creating a channel joins its creator. Opening a channel or resolving a linked page does not silently join or subscribe the viewer.

**Private** means visible only to its active channel members. Invitations disclose that joining grants access to its retained history and shared resources. Names, existence, membership, files, source URLs, counts, search suggestions, and realtime events must not leak to nonmembers. An organization administrator is not automatically a private-channel reader.

## Membership and management

Channel managers may rename, update topic/description, invite eligible members, manage posting policy, and archive/restore channels they can access. Managers cannot add people from another organization or grant organization-admin authority. Ownership/management must remain recoverable when a manager leaves, through an explicit auditable process that does not grant hidden access to content.

Joining, following notifications, starring, and organizational membership are distinct. Leaving a private channel removes future content access; leaving a public channel stops membership-based attention while its public history remains discoverable. Removal revokes subscriptions, previews, file access, and pending deliveries. A historical author remains identifiable under the account policy.

Allow a confirmed public-to-private change with clear warnings about prior exposure and changes for nonmembers. Do not claim previously read or downloaded content can be recalled. Initial private-to-public history conversion is excluded; creating a separate public channel must not copy private content implicitly.

## General and announcements

Provide one recognizable default General channel for active full members, independent of pages and Teams. Full members join automatically as a disclosed organization default. General cannot be left, archived, or deleted through ordinary channel controls, but it can be muted. Guest membership, when available, must not auto-enroll guests in General.

A posting policy may allow all members or channel managers only, making an announcements channel explicit rather than inferring it from its name. Restrictions apply to replies, uploads, scheduled sends, bots, and workflows as well as the main composer; reactions may remain allowed. Show why posting is unavailable.

## Archive and shared resources

Archiving makes a channel read-only, preserves authorized history/search/links, and stops new posts, replies, scheduled deliveries, and automation writes. An authorized manager may restore it. Archive is not deletion. A linked archived channel opens a clear read-only view; it does not cause a new chat to be created automatically.

Members with posting permission may pin authorized messages and add labeled safe links; managers may remove shared pins/resources. These are shared channel references, not copies or private saved items. Deleted or inaccessible targets show a neutral unavailable state. Canvases, lists, and files appear only once their owning features exist.

## Page-context relationship

Eligible ordinary channels can have zero or many page links under the page-linking rules. DMs and protected General are not primary page-link targets. A page link never joins a user, widens a channel's audience, or imports outside records. Avoid automatically creating a channel for every visited lead or record; discovery should favor favorites, joined channels, recency, and search.

## Acceptance behavior

A member can create/use a channel with no page, discover and join a public channel, accept a private invitation with a clear history boundary, and leave without deleting history. A nonmember cannot learn private metadata through any discovery or linked-page surface. Archive and posting restrictions hold across web, extension, replies, files, scheduled messages, and integrations. Existing work-Chat IDs/history remain intact when this target is implemented.

## Owner decisions

Confirm member-created channels, channel-manager powers, public-history access before joining, default General behavior, visibility-conversion restrictions, and whether future team-based invitation should be a one-time action or a maintained access rule. No automatic Team-to-channel access is proposed.

Reference coverage: [Slack channels and messaging catalog](https://slack.com/help/categories/200111606-Using-Slack). SideWire's permission defaults above are proposals, not assertions about Slack defaults.
