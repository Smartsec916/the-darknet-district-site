# The Function: portal and Frequencies archive

The Function is a fictional corporation that governs beyond The Darknet District.
Its public portal is fiction. Its **Frequencies** archive is not: it will publish only
real radio observations made by a monitoring station that has not been built yet.

Naming rule: **The Function**, always singular.

## What exists now and what is planned

| Piece | State |
|---|---|
| Homepage link "Back door to The Function's website" | **Built.** In the homepage hero, under the VOID//RUNNER panel. |
| Portal, `/function/` | **Built.** Department directory. Only Signal Intelligence is open; the other four departments say "No public release". No scripts. |
| Frequencies page, `/function/frequencies/` | **Built.** Monitoring status, priority channels, search and filters, record view, case files, archive standards. |
| Public read-only API (`frequencies_api.py`) | **Built, tested, switched off.** While `FUNCTION_ARCHIVE_ENABLED` is unset it answers with an empty, uncommissioned archive and touches no database. |
| Signed station uploads (`POST /ingest`) | **Built, tested, switched off.** Refused unless `FUNCTION_INGEST_ENABLED=true` and a key is configured. |
| Firestore storage for published records | **Built, tested against an in-memory stand-in only.** Never run against the real Firestore project. |
| Monitoring station (receivers, decoders, local SQLite, uploader) | **Planned, not built.** See [station-architecture.md](station-architecture.md). No hardware has been bought. |

Today the live page shows **AWAITING FIRST TRANSMISSION**, because nothing has been received.
No sample, demo or placeholder records exist in the site.

## Routes

| URL | What it is |
|---|---|
| `/function/` | Portal and department directory |
| `/function/frequencies/` | Frequencies archive |
| `/function/frequencies/?band=HF&classification=cb` | Searches are shareable as links |
| `/function/frequencies/#OBS-…` | Links straight to one record |
| `GET /api/function/frequencies/status` (Render) | Monitoring status and totals |
| `GET /api/function/frequencies/observations` | Search, filter, sort, paginate |
| `GET /api/function/frequencies/observations/<id>` | One record |
| `GET /api/function/frequencies/cases` | Unidentified-signal case files |
| `POST /api/function/frequencies/ingest` | Station uploads only (signed) |

Full contract: [api-contract.md](api-contract.md). Security and publication policy: [security.md](security.md).

## Files

- `function/index.html`, `function/function.css`, `function/seal.svg`: the portal.
- `function/frequencies/index.html`: the archive page.
- `function/frequencies/archive-core.js`: pure rules (labels, formatting, filter validation, what the page may claim). Tested in Node.
- `function/frequencies/archive-ui.js`: page wiring. Draws all archive text with `textContent`.
- `frequencies_api.py`: Flask blueprint registered in `server.py`.
- `tests/function-archive.test.cjs`, `tests/test_function_archive.py`: tests.
- `tests/function_fakes.py`, `tests/function_preview_server.py`: test-only helpers and a local preview. SYNTHETIC data lives only here.
- `docs/function/station-schema.sql`: reference schema for the station's own database (not deployed).

## Turning the archive on (later, when the station exists)

Do not do this until the station is built and its publication policy has been checked.

1. In the Firestore console for project `the-darknet-district-71873`, merge [firestore.rules](firestore.rules) into the
   existing rules, so browsers can never read or write `fn_meta`, `fn_obs` or `fn_cases` directly. The backend uses
   the Admin SDK, which these rules do not restrict. The code creates the documents itself.
2. Generate a station key on a trusted computer, for example
   `python -c "import secrets; print(secrets.token_urlsafe(48))"`.
3. In Render's dashboard, add environment variables to the existing backend service:
   - `FUNCTION_ARCHIVE_ENABLED=true`
   - `FUNCTION_INGEST_ENABLED=true`
   - `FUNCTION_INGEST_KEYS=station-1:<the key>` (to rotate, list two: `station-1:<old>,station-2:<new>`)
4. Put the same key on the station, in a file only the uploader's user can read. Never in Git, never in a page.
5. To stop uploads at any time, set `FUNCTION_INGEST_ENABLED=false`. The public archive stays readable.

Optional limits (defaults in brackets): `FUNCTION_READ_LIMIT_PER_MINUTE` (120 per visitor),
`FUNCTION_INGEST_LIMIT_PER_MINUTE` (20 per sender), `FUNCTION_EXTRA_ORIGINS` (extra browser origins for testing).

## Checking it locally

```bash
node --test tests/*.test.cjs
python -m unittest discover -s tests -t tests -p "test_*.py"
python tests/function_preview_server.py
```

The preview serves http://127.0.0.1:5199/function/ with an empty archive, exactly as production behaves today.
Add `--synthetic` to fill it with records labelled SYNTHETIC, for checking layouts only.

## Running costs

Nothing new is required. The pages are on GitHub Pages, the API is a blueprint on the existing Render
service, and records go in the existing Firestore project. A full archive read costs one Firestore
document read per ~600 KB of records, plus one read every 30 seconds per server process to check for changes,
which keeps far inside Firestore's free daily quota. If the Firebase project is on the pay-as-you-go
plan, usage beyond the free quota would be billed, but the expected volume is a tiny fraction of it.
The station's electricity is roughly $1–5 a month. Details in [station-architecture.md](station-architecture.md#costs).
