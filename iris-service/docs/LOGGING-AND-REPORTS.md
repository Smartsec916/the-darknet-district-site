# Iris: conversation history, viewer, daily reports and logs

Everything here is **off by default**. A fresh deploy stores conversations and writes
technical logs, but the viewer does not exist and no email is sent until you turn them on.

## What is stored

Each exchange is saved to Neon **before** Iris's reply is sent, so a Render sleep or
restart cannot lose it:

| Table | Holds |
|---|---|
| `chat_sessions` | one row per conversation (created on its first message) |
| `chat_messages` | every visitor message and Iris reply: `sender` (`user` / `iris`), `message`, `timestamp` (UTC), `language`, `status`, `request_id` |
| `chat_user_profiles` | names Iris learned, as before |
| `iris_api_usage` | OpenAI token counts per call (no text), for the report's cost line |
| `iris_daily_reports`, `iris_report_parts` | which days were emailed, and each emailed part |

`status` is `ok`, `fallback` (a canned reply because OpenAI failed; the text really was shown to
the visitor) or `error` (the visitor's message was kept but no reply was produced; no reply row
is invented). A retried request (same session, message and counter) is answered from storage and
never saved twice.

Not collected: IP addresses, browser details or any identifier beyond the random session id the
site generates. Passphrase messages (Admin/Eva verification) are never stored.

Existing rows are never changed or deleted. On start the service only creates what is missing
(`CREATE ... IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`). This also fixes the old error
`relation "chat_user_profiles" does not exist`, which meant the tables had never been created
in that database. Tables are now created only by the service itself, at start (see
`SCHEMA-MIGRATIONS.md`); the build step does not touch the database.

Check a database without changing it:

```bash
DATABASE_URL="postgresql://..." npm run db:check
```

It lists the tables and row counts, the new columns, and the database time zone. On start the
service also logs `schema_ready` (or `schema_incomplete` / `schema_setup_failed`).

## Private conversation viewer (off by default)

Needs **both**, set in Render's environment:

- `IRIS_ADMIN_TOKEN`: a random string of 32+ characters. Generate one with
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `IRIS_ADMIN_VIEWER=on`

Then open `https://darknet-district-iris.onrender.com/admin` and paste the token. It is kept in
the page's memory only (a reload asks again). Without both settings `/admin` and `/api/admin/*`
answer 404. There is no default token.

Every `/api/admin/*` request is checked on the server against the token; nothing in the chat,
Iris's instructions or the page can grant access. Ten wrong attempts in 15 minutes lock that
address out for the rest of the window. Admin routes send no CORS headers, so other websites
cannot call them from a browser. The viewer is read-only (list, search, filter by date, session,
message type and status, pagination, full transcripts, UTC times) and shows text with
`textContent`, so conversation content can never run as a script.

**Authentication limits to know about:** one shared token is simple, not per-person. Anyone who
has it can read every conversation. Keep it in a password manager, rotate it by changing the
Render variable, and don't paste it into chats or tickets. If you later want sign-in with your own
account (for example your existing Firebase login, as the Void Runner editor uses), that is a
separate piece of work.

## Daily email report (off by default)

**What it sends:** at about 08:05 UTC, the previous *complete* UTC day (00:00:00 to 23:59:59).
Every email is plain text and starts with a summary (reporting period in UTC, conversations,
visitor messages, Iris replies, failed or incomplete exchanges, OpenAI tokens and estimated cost
when recorded), followed by the full transcripts. A day with no conversations sends one short
"No conversations on this day." email.

**Transcript format.** Conversations are in the order they started, messages in time order
(ties broken by arrival order). Each conversation:

```
==================== Conversation 2 of 14 ====================
Session: <session id>
Started: 2026-10-31 14:02:11 UTC
14:02:11 UTC — Visitor:
    <the visitor's words, every line indented>
14:02:14 UTC — Iris:
    <Iris's reply, every line indented>
```

Failed exchanges are labelled on the header line: "Iris: (canned fallback reply; OpenAI
failed)" or "(no reply was produced; processing error)". Nothing is summarised, rewritten or
invented; any language and emoji are kept as written. The only changes are safety ones:
every line of visitor text is indented (so a visitor cannot forge a "UTC — Iris:" header or a
conversation separator), and control and text-direction-override characters are shown as
`[U+202E]`-style markers instead of being applied. There is no HTML part, so nothing in a
message can run or render in the mail client. No IP addresses or browser details are stored in
the chat tables, so none can appear; the session id is the only identifier.

**Long days.** An email holds about 200 KB (`REPORT_PART_MAX_BYTES`). A longer day becomes
"Part 1 of N", "Part 2 of N" and so on, in order, split between messages, each repeating the
summary and saying "email k of n". Read in order they are the whole transcript. Messages are
read from the database in pages (`REPORT_PAGE_SIZE`), so a very large day never loads at once.

**Email service: Brevo** (https://www.brevo.com). Free plan: 300 emails/day. Proton has no
sending API, so Proton is only the *recipient*. Expected cost: **$0**.

**Settings (Render environment unless noted):**

| Setting | Value |
| --- | --- |
| `IRIS_REPORTS_ENABLED` | `true` to send, anything else (or unset) to send nothing |
| `BREVO_API_KEY` | Brevo API key (secret) |
| `REPORT_SENDER_EMAIL` | `reports@thedarknetdistrict.com` (authenticated domain) |
| `REPORT_RECIPIENT` | `thedarknetdistrict@proton.me` (the only address ever mailed) |
| `IRIS_REPORT_TOKEN` | 32+ random characters; same value as the GitHub secret of that name |

**Scheduling.** Render's free tier sleeps, so GitHub Actions
(`.github/workflows/iris-daily-report.yml`, free) wakes the service and calls
`POST /api/admin/reports/daily` with `IRIS_REPORT_TOKEN`. Runs: **08:05 UTC** (main), **09:35
UTC** and **12:35 UTC** (retries). GitHub cron is always UTC. The token can trigger a report but
cannot read a conversation, and the request cannot choose the recipient. GitHub can delay
scheduled runs by many minutes, runs them only from the default branch (so nothing is scheduled
until the workflow is on `main`), and pauses schedules in a repository with 60 days of no
activity (re-enable under the Actions tab). The public workflow log shows only
"HTTP status, outcome", never counts or text.

**Reliability.**
- *No duplicates.* Each day and each email part has a row in Neon (`iris_daily_reports`,
  `iris_report_parts`) with its status. A day is claimed atomically, so two overlapping runs
  cannot both send it, and a retried workflow finds the day already "sent" and sends nothing.
- *Catch-up.* A scheduled run reports every complete day after the last reported one (at most
  `REPORT_CATCHUP_DAYS`, default 7), oldest first, and never today. The first run ever reports
  yesterday only. A failed day is retried before later days.
- *Partial delivery.* A rejected or rate-limited send is retried up to three times, honouring
  Brevo's `Retry-After`. Sends are spaced (`REPORT_SEND_SPACING_MS`) and capped per run
  (`REPORT_MAX_PARTS_PER_RUN`, default 25, `REPORT_RUN_BUDGET_MS`). If a run stops with parts
  unsent the service answers HTTP 202 (`partial`); the next run sends only the missing parts.
  If the day's data changed after some parts were already mailed, the report stops with an error
  instead of guessing where the parts split.
- *Timeouts.* After a timeout the email may have arrived, so the unsent part is retried by the
  next run; the worst case is one duplicate email, never a missing one.
- *Public chat unaffected.* Reports run in their own request; a failure only marks the day
  "failed" in Neon and logs `report_part_failed` / `report_failed` (counts and codes, never text).
  The workflow goes red, and GitHub emails you.
- Conversations are never deleted or changed by reporting.

**Enable / disable.**
1. Test first: run the workflow by hand with *dry run* ticked (sends nothing).
2. Send one real test: set `IRIS_REPORTS_ENABLED=true` on Render, run the workflow with a `date`
   that has real conversations. Check the email arrived complete.
3. Set `IRIS_REPORTS_ENABLED=false` again until you decide to start daily delivery; then set it
   `true` and leave it. To stop at any time: set it to `false` (takes effect on the next run),
   or disable the workflow in the Actions tab.
Note: the test day counts as reported, so the first scheduled run continues from the next day.

**Limitations.** Free-tier cold starts add up to about 80 s. The cost estimate uses the prices
in `OPENAI_PRICE_INPUT_PER_M` / `OPENAI_PRICE_OUTPUT_PER_M` and only covers calls recorded in
`iris_api_usage`. Email is not end-to-end encrypted between Brevo and Proton. A day with a very
large volume can need several runs (the 202 / retry mechanism handles this).

## Privacy: decide before enabling reports

The site currently has **no privacy policy and says nowhere that chats are stored**. Before
turning on storage review or email delivery of transcripts, I recommend:

1. **A notice in or next to the chat**, for example: "Iris conversations are stored, may be
   reviewed by the site operator, and are processed by OpenAI. Don't share personal or sensitive
   information." Link it to a short privacy page.
2. **Say that reports pass through an email provider.** A transcript emailed to you is stored by
   Brevo (as the sending service), by the mail servers in transit (TLS), and in your Proton
   mailbox. Proton encrypts what is stored there, but the content has already passed through
   Brevo in readable form. Emailing full transcripts is therefore less private than reading them
   in the viewer. If that matters, a counts-only report (no transcripts, read them in the viewer
   instead) is a small change; it is not built because you asked for full transcripts.
3. **A retention period**, for example delete conversations after 90 or 180 days, and a way to
   handle a deletion request. Nothing deletes automatically today; this was deliberate so no
   record is lost without your decision. A scheduled purge is easy to add once you pick the period.
4. **Keep collection minimal**: the service stores no IP addresses. Visitors can still type
   personal details into the chat, which is why the notice matters.
5. **Never put conversation text in tickets, public issues or screenshots.** The public GitHub
   Actions log shows only the HTTP status and outcome.

## Technical logs (Render)

One JSON object per line. Search the log for the event name.

| Event | Meaning |
|---|---|
| `server_started` / `server_stopping` / `server_stopped` | start (with which settings are present, never their values) and clean shutdown on Render's SIGTERM |
| `schema_ready` / `schema_incomplete` / `schema_setup_failed` | database tables checked on start |
| `client_ip_configured` / `client_ip_diagnostic` | how visitors are told apart behind Render and Cloudflare, and a throttled health signal (never an address); see `RATE-LIMITS.md` |
| `trusted_proxy_hops_ignored` / `trusted_proxy_range_ignored` | an invalid `TRUSTED_PROXY_HOPS` or `TRUSTED_PROXY_RANGES` entry was ignored |
| `http_request` | every `/api` request: route pattern, status, milliseconds; `slow` over 5 s; `fallback`, `saved`, `language`, `replay` for chat |
| `openai_request_failed` | an OpenAI call failed: status, error code, whether it timed out |
| `iris_fallback_reply` / `iris_fallback_welcome` | a canned line replaced a real reply |
| `openai_slow` | an OpenAI call took over 8 s |
| `conversation_save_failed` | an exchange could not be saved after one retry |
| `db_pool_error`, `db_save_slow`, `stored_reply_lookup_failed`, `usage_record_failed` | database trouble |
| `chat_message_failed` | a 500 while handling a message (the visitor message is saved with status `error`) |
| `admin_auth_failed`, `report_auth_failed` | wrong token (no token is logged) |
| `report_part_sent` / `report_sent` / `report_part_failed` / `report_failed` | daily report progress |
| `email_provider_rejected` | the email provider refused a request (status only) |

Redaction: Postgres URLs, `sk-` keys, Bearer tokens, API-key-like strings and long hex values are
masked in every field; database errors keep only the error code, table and a short message
(never the SQL or its parameters, which hold conversation text); request and response bodies are
never logged; long values are cut at 300 characters. `IRIS_DEBUG=1` turns on verbose detail that can
include visitor names, so leave it off.

**Render's free-tier sleep.** The service sleeps after about 15 minutes idle and takes about a
minute or more to wake (measured 82 s). The website pings `/api/health` when the chat opens so the
wake starts while the visitor types, shows "Uplink is waking up" after 8 s, allows 120 s, and retries
once on a dropped connection or 502/503/504; the retry is the same request, so it is answered
and stored once. On shutdown the service stops accepting requests and closes the database
connection; Neon's own sleep no longer crashes it (idle-connection errors are handled).
