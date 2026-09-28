# Lightweight calls, screen sharing, and recorded clips

Status: **Draft for owner review. Expansion target; not established as implemented.** Device permissions, provider/data handling, accessibility, and operating costs need separate approval. Calls are not a dependency of the core text communication scope. See [review scope](README.md).

This document owns live audio/video sessions and deliberately recorded clips. [Files](files-and-links.md) owns stored-media access; [Notifications](mentions-and-notifications.md) owns invitations and interruptions.

## Live conversation

An authorized channel or DM participant may start or join a lightweight call associated with that conversation. Show its audience, participants, and audio/video state. A source page is optional, and several linked pages lead to the same call rather than separate sessions.

Support join, leave, microphone mute, camera controls where supported, device selection, and connecting/reconnecting/ended states. Denied device permissions do not disable ordinary messaging. Opening a chat or previewing a call must not start capture.

The audience inherits the current conversation. A join link alone does not authorize access. Joining and continued participation must be enforceable through the selected provider; deactivation/removal stops new joins and ends unauthorized participation. All connected people and bots are visible. Organization administrators do not receive hidden listening access.

## Screen sharing

Sharing requires an explicit action and the browser/OS source chooser, with a persistent indication of what is shared and how to stop. Starting a call does not share the active tab automatically or expand the extension's page-reading permissions. Warn that the chosen screen/window may expose other information; do not claim automatic complete redaction.

A shared screen is live media, not an automatic page-context record or image archive. Remote control and unattended capture are excluded. Viewing a source page together does not establish that everyone has access to its underlying service.

## Recorded clips

Allow a user to record supported audio/video/screen media deliberately, stop, preview, discard/redo, and select a destination before publishing. A discarded recording creates no chat message. Enforce configured duration, size, processing, and storage limits with useful failure states.

Published clips are authorized attachments with playback controls, readable labels, and supported captions/transcripts. Transcription must be identified as generated and potentially inaccurate, with correction where supported. Provider selection and data handling require approval. State when captions or a transcript are unavailable rather than fabricating them.

## Recording and lifecycle

Live-call recording is separately opt-in and not implied by asynchronous clips. Before enabling it, define who may start recording, visible participant notice/consent, late-join behavior, storage ownership, retention, and stop controls. The policy needs appropriate review; this document is not a legal assurance.

A disclosed minimal call-history item may record start/end and participants. Do not silently retain media, transcripts, or attendance analytics. Missed-call/invitation alerts respect preferences and are deduplicated; reconnect must not ring everyone repeatedly.

Archive/posting restrictions prevent starting new calls or publishing clips under the proposed default. A destination becoming unavailable ends its active call safely. Stored media follows current file authorization and content retention. A provider outage or unsupported client must never be displayed as an active successful connection.

## Acceptance behavior

Authorized coworkers join the same session from supported clients, recover from interruption, and see accurate capture state. Access removal ends unauthorized participation. A user previews/discards a clip without publishing it. Screen sharing always requires deliberate source selection. Permission denial, unsupported devices, provider failure, storage limits, and missing captions have clear outcomes.

## Owner decisions

Confirm audio-only versus video scope, group and duration limits, provider/data region, cost controls, screen-sharing support by client, transcript retention, and whether live recording is necessary. Calendars, webinars, telephony, dial-in numbers, and a full conferencing replacement are excluded.

Reference coverage: [Slack huddles](https://slack.com/help/articles/4402059015315-Use-huddles-in-Slack) and [Slack clips](https://slack.com/help/articles/4406235165587-Record-audio-and-video-clips-in-Slack).
