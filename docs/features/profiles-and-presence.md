# People, profiles, status, and presence

Status: **Draft for owner review. Core target; collaboration-specific behavior not established as implemented.** Existing account identity and organization membership remain the foundation. See [review scope](README.md).

This document owns discoverable coworker profiles, self-declared status, approximate presence, typing indicators, and related personal preferences. Membership/roles belong to [Accounts](accounts-and-organizations.md); interruption controls to [Notifications](mentions-and-notifications.md).

## Profiles and directory

Provide an organization-scoped people directory and compact profile cards with display name, avatar, optional role/title, timezone/local time, and optional self-provided profile details. Stable user identity, not display-name text, links authorship and mentions. Changing a name/avatar must not create another author or change historical recipients.

A profile is not a public internet directory. Hide sensitive authentication data, sessions, billing information, internal operator roles, and private-chat memberships. Email visibility and optional contact fields follow an explicit organization/user policy, not assumed publication. Guest-directory visibility, if guests ship, is limited by External collaboration.

Offer start DM, view shared authorized channels, and mention actions only when permitted. Viewing a profile does not reveal every private conversation that person belongs to. Inactive authors remain recognizable in retained history with a clear inactive label, but cannot be selected as new active recipients/assignees.

## Self-declared status

Members can set a short status and optional emoji, with a clear expiration choice. Status is user-entered context, not a verified statement of location, productivity, or availability. Allow manual active/away preference and easy clearing. Respect existing identity/profile settings rather than creating parallel user records.

A status such as vacation does not itself pause notifications unless the UI explicitly offers and confirms that action. Notification schedules, timezone, and status expiration must not silently overwrite one another. Optional pronouns/name-pronunciation fields can be added without making them mandatory.

## Presence

Show only approximate active/away/offline/unknown availability supported by the client session. A stale or disconnected heartbeat must expire to unknown/offline instead of displaying fabricated certainty. A person can be active on another device without having read a particular message. Presence is not a read receipt.

Use SideWire interaction/session information, not host-page content, browsing history, webcam activity, keystroke collection outside the app, or location tracking. Do not show which external page a coworker is currently visiting. No attendance, productivity score, minute-by-minute work log, or manager surveillance dashboard is included.

Aggregate concurrent authorized clients sensibly; closing one browser tab should not mark someone offline while another is active. Let users opt out of sharing detailed presence where supported by the chosen policy. Avoid exposing exact last-seen timestamps as a default.

## Typing indicators

Typing is a short-lived hint scoped to the actual conversation/thread and currently authorized audience. It conveys no draft text, source URL, attachment title, or clipboard contents. Expire quickly on inactivity/disconnect. Do not retain typing as history, send notification alerts for it, or replay stale indicators after reconnect.

Private channels and DMs authorize both publishing and subscribing. When membership changes, stop indicators along with content delivery. A typing indicator in a thread must not reveal that private thread to an unauthorized person or pretend the person is composing in the main chat.

## Personal display preferences

Support readable message density, time display/timezone, notification sound/preview choices, and accessible reduced-motion behavior through existing preference surfaces. Theme customization/dark mode is optional polish and should use shared tokens rather than delay a coherent initial light theme. A compact dark global header in the existing shell is not a commitment to a full dark theme.

## Acceptance behavior

A member finds a coworker, opens a DM, and sees accurate identity after a rename. Presence expires honestly after disconnect and never proves a message was read. Typing disappears promptly and never exposes unsent content or browsing context. Removed members and private memberships do not leak through directory/profile suggestions. Status expiration and notification pause behave independently and visibly.

## Owner decisions

Confirm profile email visibility, optional profile fields, presence opt-out/default, and whether a people directory should show all active full members. Exact status limits and heartbeat expiry are bounded implementation settings, not claims of realtime availability accuracy.

Reference coverage: [Slack profile, preferences, status, and messaging catalog](https://slack.com/help/categories/200111606-Using-Slack).
