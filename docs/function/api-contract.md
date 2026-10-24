# Frequencies archive: data and API contract

Version 1. Implemented in `frequencies_api.py`; tested in `tests/test_function_archive.py`.
The station's own database (see `station-schema.sql`) is the authoritative record. The public
archive holds only what the station has cleared for publication.

## Conventions

- Times are UTC, written `YYYY-MM-DDTHH:MM:SSZ`. Fractions of a second are accepted and dropped.
  Times more than 5 minutes in the future are refused.
- Frequencies are whole hertz (`27185000`), from 3 kHz to 30 GHz. The page converts to and from MHz.
- Unknown fields are refused everywhere. This is deliberate: nothing unplanned (addresses,
  coordinates, device identifiers) can be carried into the public archive.
- Text fields have control, zero-width and bidi-override characters replaced with `�`
  (they can hide or reorder text). Single-line fields have whitespace collapsed.
- Records are immutable. To correct one, retract it and upload a replacement with a new id.

## Observation

| Field | Type | Rules |
|---|---|---|
| `id` | string | `OBS-` then 4–48 of `A–Z 0–9 -`. Chosen by the station, unique forever. |
| `observed_at` | UTC time | Start of the transmission. |
| `frequency_hz` | integer | Centre frequency. |
| `band` | string | **Set by the server** from the frequency (ITU: LF, MF, HF, VHF, UHF, SHF). Not accepted from the station. |
| `mode` | code | `am`, `fm`, `nfm`, `usb`, `lsb`, `cw`, `digital`, `unknown`. Shown as "Signal type". |
| `duration_s` | number or null | 0–86400. |
| `classification` | code | `cb`, `vhf_voice`, `uhf_voice`, `amateur`, `marine_vhf`, `shortwave`, `morse_cw`, `meshtastic_lora`, `digital_data`, `numbers_candidate`, `unknown`. Only what the evidence supports; `unknown` otherwise. |
| `receiver` | string | Non-geographic alias, `[A-Z][A-Z0-9-]{1,23}`, e.g. `RX-ALPHA`. |
| `case_id` | string or null | `CASE-…`, if the signal belongs to a case file. |
| `publication` | code | `full` or `metadata_only`. Anything else is refused: withheld, private, encrypted and unreviewed traffic never leaves the station. |
| `identification` | object | See below. |
| `content` | object | See below. |
| `analysis` | object or null | `{summary ≤1000, method ≤120, confidence 0–1 or null}`. Automated, labelled as such. |
| `signal` | object | `{bandwidth_hz, snr_db, peak_dbfs}`, each optional. |

`identification`:

| `status` | Requirements |
|---|---|
| `unidentified` | No `label`. |
| `possible` | `label` required; `basis` and `confidence` recommended. Shown as unconfirmed. |
| `identified` | `label` **and** `basis` (the evidence) required. |

`content`:

| Field | Rules |
|---|---|
| `kind` | `none`, `transcript`, `morse`, `digital`. |
| `text` | Required unless `kind` is `none`; must be absent when it is. ≤ 8000 characters, line breaks kept. Never fill in missing words: write `[unintelligible]` for passages that could not be made out and `[?word?]` for uncertain words. |
| `language` | Language tag such as `en` or `es-MX`, or null if not identified. |
| `confidence` | 0–1 or null. |
| `withheld` | **Set by the server.** For `metadata_only` records the server discards any text and returns `{kind, text: null, language: null, confidence: null, withheld: true}`. |

## Case file

For a recurring signal that remains unidentified.

| Field | Rules |
|---|---|
| `id` | `CASE-` then 2–32 of `A–Z 0–9 -`. |
| `designation` | ≤ 80 characters, a neutral descriptive name. |
| `status` | `open`, `identified`, `closed`. |
| `first_detected_at`, `last_detected_at` | UTC times; first ≤ last. |
| `frequencies_hz` | 1–50 integers (deduplicated, sorted). |
| `characteristics` | ≤ 2000 characters or null. |
| `decoding_attempts` | ≤ 50 × `{at, method ≤120, result: failed/partial/decoded, notes ≤500}`. |
| `possible_identifications` | ≤ 10 × `{label, basis, confidence}`. Always shown as unconfirmed. |
| `observation_ids` | ≤ 500 ids. **The public view lists only ids that are actually in the public archive**, so a case's history can never cite a record nobody can see. |

Case files are replaced whole on each upload (they change as evidence accumulates).

## Station heartbeat

Sent with any upload. Drives the "Receiver", "Last synchronization", "Active monitoring sources"
and priority-channel lines on the page. A receiver that has not reported for 15 minutes is shown as **No contact**.

```json
{
  "sent_at": "2026-11-01T12:00:00Z",
  "receivers": [
    {"alias": "RX-ALPHA", "state": "online",
     "channels": [{"frequency_hz": 27185000, "role": "priority"}, {"frequency_hz": 27065000, "role": "priority"}]}
  ],
  "queue_depth": 0,
  "last_observation_at": "2026-11-01T11:58:40Z",
  "coverage_gaps": [
    {"started_at": "2026-11-01T03:10:00Z", "ended_at": "2026-11-01T03:14:30Z", "frequency_hz": null, "reason": "power"}
  ]
}
```

`state`: `online`, `degraded`, `offline`. `role`: `priority`, `scan`. Gap `reason`: `receiver_offline`,
`scanning_elsewhere`, `power`, `network`, `maintenance`, `unknown`. `frequency_hz: null` means all channels.
Limits: 16 receivers, 64 channels each, 50 gaps.

## Public endpoints (read-only)

Base: `https://the-darknet-district-site.onrender.com/api/function/frequencies`.
Browsers may call these only from `thedarknetdistrict.com`. Each visitor is limited to
120 requests a minute. Successful responses may be cached for 30 seconds.

`GET /status`

```json
{
  "archive": "not_commissioned",
  "receiver_state": "not_commissioned",
  "last_observation_at": null,
  "last_sync_at": null,
  "totals": {"observations": 0, "identified": 0, "possible": 0, "unidentified": 0, "decoded": 0, "case_files": 0},
  "active_sources": 0,
  "sources": [],
  "coverage_gaps": [],
  "generated_at": "2026-10-24T18:00:00Z"
}
```

`receiver_state`: `not_commissioned` (no station has ever reported), `online`, `degraded`, `offline`, `no_contact`.
`decoded` counts records with decoded content, including content withheld from publication.

`GET /observations` takes these query parameters (all optional):

| Parameter | Meaning |
|---|---|
| `q` | Case-insensitive text search over id, decoded text, identification label and analysis summary. ≤ 100 characters. |
| `id` | Observation id, or part of one. |
| `from`, `to` | Dates `YYYY-MM-DD`, inclusive, UTC. |
| `fmin`, `fmax` | Hertz, inclusive. |
| `band`, `mode`, `classification` | Codes as above. |
| `status` | Identification status. |
| `decoded` | `yes` or `no`. |
| `sort` | `newest` (default), `oldest`, `freq_asc`, `freq_desc`. |
| `page`, `per_page` | Page from 1; `per_page` is 10, 25 (default), 50 or 100. |

Returns `{total, page, per_page, pages, observations: [...]}`. Bad parameters return 400.

`GET /observations/<id>` returns `{observation}` or 404. `GET /cases` returns
`{cases: [...]}` with `observation_count` and `observations: [{id, observed_at, frequency_hz}]` added.

Writes to any public path return 405.

## Station upload

`POST /ingest`, JSON body up to 256 KB:

```json
{
  "batch_id": "rx-alpha-20261101-0001",
  "observations": [],
  "cases": [],
  "retractions": ["OBS-..."],
  "heartbeat": {}
}
```

Limits: 200 observations, 50 cases and 200 retractions per batch. `batch_id` is 8–64 of `A–Z a–z 0–9 -`.

### Signing

Four headers, all required:

| Header | Value |
|---|---|
| `X-Function-Key-Id` | The key's id, e.g. `station-1`. |
| `X-Function-Timestamp` | Unix seconds. Must be within 5 minutes of the server's clock. |
| `X-Function-Nonce` | 16–64 letters/digits, never reused. |
| `X-Function-Signature` | Lower-case hex HMAC-SHA256, below. |

```python
import hashlib, hmac, json, secrets, time, urllib.request

def upload(batch, key_id, secret, url="https://the-darknet-district-site.onrender.com/api/function/frequencies/ingest"):
    body = json.dumps(batch, separators=(",", ":")).encode()
    timestamp, nonce = str(int(time.time())), secrets.token_hex(16)
    message = "\n".join([timestamp, nonce, "POST", "/api/function/frequencies/ingest", hashlib.sha256(body).hexdigest()])
    signature = hmac.new(secret.encode(), message.encode(), hashlib.sha256).hexdigest()
    request = urllib.request.Request(url, data=body, method="POST", headers={
        "Content-Type": "application/json", "X-Function-Key-Id": key_id, "X-Function-Timestamp": timestamp,
        "X-Function-Nonce": nonce, "X-Function-Signature": signature})
    with urllib.request.urlopen(request, timeout=90) as response:  # verifies TLS by default
        return json.load(response)
```

### Results and retries

`200` returns `{duplicate_batch, accepted, duplicates, retracted, cases}`.

- A batch id already applied in the last 7 days returns `duplicate_batch: true` and changes nothing,
  so the station can safely resend a batch whose response it never received. Sign every attempt afresh.
- An observation whose id, or whose receiver + time + frequency, is already published is counted
  in `duplicates` and skipped.
- The station should mark records synced only after a `200`.

| Status | Meaning | Station should |
|---|---|---|
| 401 | Bad signature, unknown key, stale time or reused nonce | Stop and alert; check the clock and key. |
| 413 | Body too large | Split the batch. |
| 415 / 422 | Not JSON / record refused (message says which field) | Quarantine the record locally. Do not retry unchanged. |
| 429 | Too many uploads | Back off. |
| 503 | Uploads switched off, or service waking or failing | Keep the queue and retry with backoff (Render may take up to a minute to wake). |
