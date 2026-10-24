# Frequencies archive: security and publication policy

Two things must stay true:

1. Visitors to the website can never reach the monitoring station or the household network.
2. Nothing received over the air can control the station, the website backend, or the people reading it.

## Architecture

```
Monitoring station ── HTTPS, outbound only, signed ──▶ Render backend ──▶ Firestore
 (home, behind the                                       │  (API only)
  T-Mobile gateway)                                      ▼
                                       Visitors ◀── GitHub Pages page reads the public API
```

The station starts every connection. Nothing in the website, the API or the DNS points at the
station, and no port on the gateway is opened. On T-Mobile Home Internet the gateway normally
sits behind carrier-grade NAT, so unsolicited inbound IPv4 cannot reach the home anyway;
the design does not rely on that.

## Controls in place now

These are implemented in this change and covered by tests (`tests/test_function_archive.py`,
`tests/function-archive.test.cjs`). The upload path is switched off in production until the station exists.

| Control | Where | Verified by |
|---|---|---|
| Public API is read-only; every write to a public path returns 405 | `frequencies_api.py` | `test_public_cannot_write` |
| Uploads refused unless `FUNCTION_INGEST_ENABLED=true` **and** a key of ≥ 32 characters is configured | `authenticate()` | `test_uploads_need_the_switch_and_a_key`, `test_uploads_refused_until_commissioned` |
| HMAC-SHA256 signature over time, nonce, method, path and a hash of the body; constant-time compare | `sign()`, `authenticate()` | `test_unsigned_forged_stale_and_unknown_requests_are_refused`, `test_signature_covers_the_body` |
| Replay protection: ±5 minute clock window and single-use nonces held in Firestore | `ArchiveStore.apply()` | `test_replayed_request_is_refused` |
| Idempotent retries (batch id remembered 7 days) and duplicate-record detection | `ArchiveStore.apply()` | `test_retried_batch_is_idempotent`, `test_duplicate_observations_are_skipped` |
| Size limits: 256 KB body, 200 records per batch, per-field length caps | `guard_request()`, validators | `test_oversized_body_is_refused` |
| Rate limits: 120 reads/minute per visitor, 20 uploads/minute per sender | `Window` | `test_reads_are_rate_limited_per_visitor`, `test_ingest_rate_limit` |
| Strict schema: unknown fields refused, so addresses, coordinates and device ids cannot ride along | `fields()` | `test_unplanned_fields_cannot_ride_along` |
| Only `full` or `metadata_only` records accepted; text of `metadata_only` records discarded server-side | `clean_observation()`, `clean_content()` | `test_unreviewed_traffic_cannot_be_published`, `test_withheld_content_is_never_stored` |
| Responses list only whitelisted fields; no network, device or credential fields exist to leak | `public_observation()`, `status()` | `test_public_responses_carry_no_network_or_device_details` |
| Upload log lines hold counts and key id only, never the body or sender address | `ingest()` | `test_log_line_has_counts_only` |
| Browsers may call the API only from the site's own origins; signing headers are not allowed cross-origin | `server.py` CORS | `test_only_the_site_may_read_from_a_browser` |
| Hidden, zero-width and bidi-override characters neutralised in all text | `text()` | `test_hidden_and_reordering_characters_are_neutralised` |
| Decoded text served as JSON data and drawn with `textContent` only | `archive-ui.js` | `test_markup_is_returned_as_inert_json_text`; Node test forbids `innerHTML` and friends |
| Page CSP: `default-src 'none'`, own scripts only, one API host, Trusted Types enforced (raw-HTML sinks throw) | `function/frequencies/index.html` | Node test "Function pages run only their own scripts" |
| No analytics, cookies, storage or third-party scripts on Function pages | pages | same Node test |
| No secrets in the repository or the page; keys only in Render environment variables | — | The page holds only the public API address |

## Controls that need action before uploads are switched on

- Merge [firestore.rules](firestore.rules) into the project's Firestore rules. Without it, the
  Firestore project's existing rules decide whether a browser could touch `fn_*` collections directly.
- Generate the station key on a trusted machine; store it on the station readable only by the uploader's user.
- Rotate the key if the station is ever lost, sold, reinstalled from an untrusted image, or suspected compromised.

## Threats and residual risks

**Compromised station.** Anyone who controls the station holds its upload key and can publish false
records or retract real ones. Limits: the key can do nothing else (no reads of private data, no admin
functions), uploads are size- and rate-limited, and switching `FUNCTION_INGEST_ENABLED` off stops it at once.
Recovery: rotate the key, retract bad records, restore the station from a known-good image.

**Compromised Render service or Firebase credentials.** Outside this design's control; the same risk
already applies to the game and chat APIs on that service.

**Station address is visible to Render and its network provider.** Any outbound HTTPS request reveals the
home's public address to the server that receives it. The code never stores, logs or returns it, but
Render's own platform request logs, visible to the account owner, may record it. With carrier-grade NAT
that address is shared with other T-Mobile customers, which blurs it further but is not a guarantee.

**Lateral movement inside the home.** With an unmanaged switch, the station shares a network with
every other household device. A host firewall that refuses all inbound traffic and blocks outbound
connections to private addresses reduces this a lot, but it is enforced by the station itself:
if the station is fully compromised, its own firewall can be switched off. Real separation needs
a device in between. See [station-architecture.md](station-architecture.md#optional-isolated-monitoring-network).
The site never claims the station is isolated.

**Radio data aimed at software.** Someone can transmit text designed to look like markup, commands or
instructions to an AI. Defences: transcripts are only ever data; nothing on the station or server
executes, follows or interprets them; the page draws them as text under a Trusted Types CSP; if AI-assisted
classification is added later, the model gets the transcript as quoted data, its output is limited to fixed
classification codes plus a confidence, and it is never given tools.

**Denial of service.** Rate limits slow single sources; a large distributed flood against Render is
not something this project can absorb on its own. The station keeps its queue during outages.

**Cold starts.** If the Render service sleeps when idle, the first page load after a quiet spell can wait
up to a minute. The page says so and never shows guessed data while it waits.

**Firestore rules not merged.** Until the rules above are merged, protection of the `fn_*` collections
from direct browser access depends on whatever rules the project already has.

## Publication policy

Receiving a signal does not make it lawful or decent to publish. The station decides each record's
class before anything is queued for upload, and the server enforces the result again.

| Class | Leaves the station? | Examples |
|---|---|---|
| **Publish in full** | Yes, `publication: "full"` | Broadcasts for the general public; CB and amateur radio voice and Morse that pass the personal-information screen; time and weather broadcasts; numbers-station broadcasts. |
| **Metadata only** | Yes, `publication: "metadata_only"`, with no text | Marine and aviation working traffic; FRS/GMRS and business radio; anything whose status is unclear. |
| **Withhold** | No | Encrypted traffic of any kind; private or protected communications (cordless and cellular telephony, pagers); Meshtastic direct and channel messages and node positions; anything with personal information pending review. |
| **Quarantine for review** | No, until a person reviews it | Transcripts that mention names with phone numbers, street addresses, licence plates, medical or financial details; distress or emergency traffic; anything the classifier is unsure about. |

Defaults when in doubt: **withhold the content and publish metadata only, or nothing.**

Legal notes (United States; this is not legal advice, and state law can be stricter):

- 47 U.S.C. § 605 restricts divulging the contents of radio communications not meant for the public,
  but excludes broadcasts for the general public and amateur and citizens band transmissions, among others.
- 18 U.S.C. § 2511(2)(g) allows intercepting communications "readily accessible to the general public",
  but excludes encrypted transmissions, among others. Cellular, cordless-telephone and paging traffic carry
  their own protections.
- Several states restrict publishing police and emergency traffic.
- The station must never try to defeat encryption, including Meshtastic channel encryption with a known default key.

Meshtastic specifically: only aggregate, non-identifying telemetry (for example, how many packets were heard in
an hour) may be published. Positions, node names and message contents are never published.
