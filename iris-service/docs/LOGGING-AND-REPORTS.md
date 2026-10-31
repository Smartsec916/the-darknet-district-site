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
in that database (`npm run db:push` had not been run against it).

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

**What it sends:** at about 08:05 UTC, the previous UTC day: counts (conversations, visitor
messages, Iris replies, errors, OpenAI tokens and estimated cost) and every transcript in order.
A day under about 60 KB is in the email body; a larger day is split into numbered `.txt`
attachments (about 1 MB each) and sent as "Part 1 of N", so nothing is cut off. A day with no
conversations sends a short zero-activity email.

**Email service: Brevo** (https://www.brevo.com). Free plan: 300 emails/day, REST API, no
card needed. Resend (3,000/month, 100/day) is the main alternative but requires a verified
sending domain before it will deliver anywhere useful. Proton has no sending API, so Proton is
only the *recipient*. Expected cost: **$0** (a report is one to a few emails a day).

**Set-up (you do these; they need your accounts):**

1. Create a Brevo account and verify a sender (Senders, Domains & Dedicated IPs). Authenticating
   `thedarknetdistrict.com` with the DNS records Brevo shows (SPF/DKIM) gives the best
   delivery to Proton; a single verified sender address works but is more likely to land in spam.
2. Create an API key (SMTP & API, API keys).
3. In Render, set: `BREVO_API_KEY`, `REPORT_SENDER_EMAIL` (the verified sender),
   `REPORT_RECIPIENT` (the Proton address), and `IRIS_REPORT_TOKEN` (32+ random characters).
4. In GitHub (Settings, Secrets and variables, Actions) add the secret `IRIS_REPORT_TOKEN`
   with the same value.
5. Run the **Iris daily report** workflow manually with *dry run* ticked. It sends nothing and the
   public log shows only the outcome.
6. Only when you approve the privacy points below: set `IRIS_REPORTS_ENABLED=true` on Render.

**Scheduling.** Render's free tier sleeps, so an in-process timer would miss runs. A GitHub
Actions schedule (`.github/workflows/iris-daily-report.yml`, free) wakes the service and calls
`POST /api/admin/reports/daily` with `IRIS_REPORT_TOKEN`. That token can trigger a report but
cannot read a conversation, and the request cannot choose the recipient (it is always
`REPORT_RECIPIENT`). The workflow retries at 09:35 and 12:35 UTC; a day already sent is never sent
again. Caveats: GitHub can delay scheduled runs by many minutes, runs scheduled workflows only
from the default branch (so it does nothing until merged), and pauses schedules in a repository
with no activity for 60 days (re-enable under the Actions tab).

**Failure behaviour.** Each part is recorded when sent. A rejected or rate-limited send is retried
up to three times. After a timeout the email may already have arrived, so it is *not* retried
automatically; the next scheduled run resends it, which can occasionally mean one duplicate part
rather than a missing one. If a later part fails, the next run sends only the unsent parts.
Failures appear in Render's logs as `report_part_failed` / `report_failed` and the workflow turns
red (GitHub emails you).

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
