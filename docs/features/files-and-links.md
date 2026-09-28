# Files, attachments, snippets, and safe links

Status: **Draft for owner review. Core attachments and safe links; richer previews are expansion.** No complete attachment feature was established in the baseline. See [review scope](README.md).

This document owns chosen-file upload, processing, authorized preview/download, message attachments, text snippets, and link previews. Calls/clips own recording; retention belongs to [Administration](administration-and-data-lifecycle.md).

## Upload and presentation

Members with posting permission may choose files, paste supported clipboard images, or drag files into a channel/DM/thread composer. Show filenames, sizes, progress, cancel/remove, retry, and processing states before submission. A message may contain only attachments. The server validates actual file type, configured counts/size/storage limits, and destination access; file extensions and client metadata are not trusted.

Files remain unavailable until security/processing checks permit access. Quarantined, rejected, or failed files have clear states and cannot be downloaded through a guessed URL. Never render active HTML, scripts, or unsafe document content inside the application origin. Generate safe image/document previews where supported; unsupported types get a download-only representation. Support captions and image alt text. Do not imply every file type has a preview.

A file is owned within its organization and authorized through its actual conversation/resource association. Private storage, preview routes, thumbnails, and downloads enforce current access. Any time-limited download credential must have bounded exposure; where immediate revocation is required, use an authorization-checking delivery path. Revocation cannot recall files already downloaded by a recipient.

## Sharing and discovery

Show an authorized Files view with filename/type, uploader, time, and originating chat/message. Searchable names and previews obey the same access rules as the message; file-text extraction is a separate approved capability, not an automatic promise.

Sharing a file reference into another chat does not silently grant access or copy private content. An explicit copy/disclosure action, if added, must preview the new audience and require permission to disclose. Message deletion and retention remove ordinary access to its attached files and derived previews; independent copies created through a disclosed action follow their own ownership.

Text/code snippets may be attached as safely rendered text with a language label, line wrapping, and copy action. They are never executed. Do not use arbitrary embedded applications as file viewers.

## Links and previews

Safe linkification and labeled URLs are core. A pasted link is not a primary page-context association and does not start external synchronization. Reject unsafe schemes, credential-bearing/session links, and sensitive temporary access URLs according to page safety rules; warn without logging the rejected URL.

Rich external previews are optional. Before enabling them, define opt-out/disable controls and a safe fetch policy: no authenticated host cookies, no internal/private-network destinations, no unsafe redirect or DNS-rebinding path, bounded response size/time, and no script execution. Preview fetching must not expose organization credentials or become a server-side request-forgery proxy. Prefer a plain link when safety cannot be established.

Internal SideWire previews are permission-checked for each viewer, not generated once using the sender's broader access and shown to everyone. Source-page thumbnails or screenshots are not captured automatically by the extension. A user may upload a file they deliberately selected; this does not authorize screen capture or DOM extraction.

## Failure and cleanup

Abandoned uploads must have a documented cleanup policy. Retrying upload/message submission cannot attach duplicate files or charge the user for phantom copies. Storage exhaustion preserves the draft and existing history. Access removal during upload prevents publication into the old destination. Deleting a message removes accessible previews and search metadata; physical deletion and recovery use the chosen lifecycle policy.

## Acceptance behavior

A member can upload, retry, preview/download, find, and remove an attachment without losing the draft. A nonmember cannot access its bytes or metadata via any derivative URL or search result. Unsafe payloads and hostile preview URLs fail safely. Page links do not expand file access. Cancellation, quarantine, revoked membership, archive, and full storage all have explicit outcomes.

## Owner decisions

Approve allowed file types, per-file and per-message limits, organization storage policy, scan/processing service, orphan cleanup timing, and whether rich previews ship initially. No unlimited storage, content-extraction provider, or browser capture permission is approved here.

Reference coverage: [Slack file sharing, snippets, link previews, and accessibility catalog](https://slack.com/help/categories/200111606-Using-Slack).
