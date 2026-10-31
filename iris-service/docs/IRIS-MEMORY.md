# Iris: long-term conversation memory

Iris remembers what a visitor actually said, across page refreshes, browser sessions, Render restarts and deploys,
until a person or the administrator deletes it. Nothing expires.

## What changed from before

Transcripts were always saved in Neon but never read back. "Memory" meant relationship data only (numbers, up to five
short notes, a 240-character recap). Now the stored messages themselves are read back, exactly as written.

| Layer | What it is | Where it lives | Used for |
| --- | --- | --- | --- |
| Conversation memory | the exact messages, both sides, with time and status | `chat_messages` (new column `memory_key`) | recalling what was said |
| Relationship memory | trust, mood, a few notes, a short recap | `iris_relationships` | tone and familiarity |
| Short-term chat | the last 9 turns of the current chat | server RAM (rebuilt from `chat_messages` after a restart) | the flow of this chat |
| Browser identity | a random id the browser keeps (`irisClientId`) | the visitor's own browser | recognizing an anonymous visitor |

## Whose messages are whose

`chat_messages.memory_key` is the same key the relationship memory uses (`identity.ts`):

| Visitor | Key |
| --- | --- |
| Anonymous, with the browser id | the id itself |
| Signed in | `user:<Firebase account id>` |
| Owner (administrator, Owner mode) | `owner:<account id>` |
| Owner testing as Returning Visitor | `test-returning:<account id>:<n>` (a reset starts a new `<n>`) |
| Owner testing as New Visitor | none: stored for the record, never remembered |

Every read is limited to the caller's own keys. The only way to widen them is an account's recorded consent
(`iris_memory_links`). A browser can never claim an account, owner or test key (those prefixes are refused as ids).
Older rows with no key stay exactly as they were; they count as someone's only through a chat session created with
that browser id (the legacy path), or when the owner adopts a chat from the panel.

## How memory is retrieved

1. **Rebuilding a chat after a restart.** If the server no longer holds this chat, its own stored messages rebuild the
   short-term window, so nothing said earlier in the same chat is lost.
2. **Recent context.** In a chat's first three messages, the visitor's last conversations (at most 12 messages) are added.
3. **Long-term recall.** When the visitor asks about something earlier ("what was my test phrase?", "what did I tell you
   yesterday?", in English, Spanish, Russian, Chinese and more), the stored messages that best match are found and added.
   The search takes the question's main words, looks across the whole history for messages that contain all of them
   (newest first, 80 at most), those that contain any, and the latest 60 (or the ones in the time window "yesterday",
   "last week", "3 days ago" name), ranks at most about 240 rows, and keeps the best matches with the other half of each
   exchange. No embedding service, no summarizing model, no extra OpenAI call.

Only messages that really succeeded count: Iris's canned fallback replies, exchanges where no reply was produced, and the
site's developer-tools signals are never memories. Lines already in the current chat's window are not repeated.

Budgets: at most 12 recent messages, 6 matches (plus their partners), about 3,000 characters per block
(`IRIS_MEMORY_BUDGET_CHARS`, 600 to 12,000), 400 characters per message.

## Staying accurate

The memory block is labeled private DATA, each message is a quoted single line with its UTC time, control characters and
look-alikes of Iris's state line are removed, and she is told: only claim what is in the block, in this chat, or in her
private notes; otherwise say honestly she does not remember; never invent a past conversation. When the search finds
nothing she is told so; when the lookup fails she is told it failed and must say her memory isn't responding. A visitor
who cannot be recognized (no stable identity) is told so. The same honesty rule is in her permanent character core.

## Deleting memory (explicit, confirmed, authorized)

Three different things, deleted separately:

| What | What it is | Deleted by |
| --- | --- | --- |
| **Conversation transcripts** | the stored messages Iris can recall (and that appear in the admin viewer and daily reports) | the owner of that identity, or the administrator |
| **Relationship data** | mood, trust, notes, recap in `iris_relationships` | same |
| **Browser-local identity** | the random `irisClientId` in the visitor's browser | the visitor (clearing site data); the server never touches it |

- Signed-in visitor: account menu, "Forget what Iris remembers". It shows what is stored, asks, then calls
  `DELETE /api/me/memory` with the confirmation phrase (`delete my memories`) and a scope (`conversations`,
  `relationship` or `all`). Browsers they linked are removed too.
- Anonymous visitor: the sign-in panel's "Delete what Iris remembers about this browser"
  (`POST /api/chat/memory`, `POST /api/chat/forget`). The browser's own id is the proof.
- Owner: Iris Controls, "Delete owner / returning-visitor conversations" (confirmed), or the token-protected
  `DELETE /api/admin/memory/<key>?confirm=delete%20my%20memories&scope=...`.
- Every deletion API refuses without the exact confirmation phrase. Nothing automatic deletes a message.
- Deleting transcripts also removes those messages from the viewer and from future report archives.
- Game progress, the Firebase sign-in and the browser's Iris id are never touched.
- Resetting a simulated Returning Visitor starts a new test identity and leaves the old test transcripts in place (unreachable
  by Iris); delete them explicitly if wanted.

## Retention (`IRIS_MEMORY_RETENTION_DAYS`)

Before this change it deleted relationship records after 180 days unseen (never transcripts). Now the default is `0`:
nothing expires. A positive number is an explicit operator opt-in that removes only relationship records; conversations
are never expired by any setting. If Render still has this variable set to a number (for example 180), set it to `0`
or delete it.

## Linking an anonymous history to an account

Unchanged principle: never automatic, never by IP. The account holder chooses "Link my Iris history" and confirms; the
relationship record is copied (the anonymous record stays) and the browser's conversations are added to the account's
memory through a recorded link. Deleting the account's memory removes the link and the linked conversations.
The administrator account keeps a separate memory and cannot link.

## The legacy Admin/Eva recall (documented, not changed)

`routes.ts` still contains the lore feature where a verified Admin or Eva asks about "last time". Its dependencies:
the keywords in the chat route, `storage.getRecentMessagesForSpecialUser(<other person>)`, which finds sessions through
`chat_user_profiles.display_name` ("admin" or Eva's aliases) joined to `chat_sessions.client_id` (set only by
`/api/chat/session`, i.e. the widget and the full chat page, not the homepage chat), then takes the OLDEST 30 messages,
five 60-character samples. For the Admin it fetches Eva's conversations, not their own. It also serves
`POST /api/special-user/recall` and `/api/chat/recall`. It still runs, unchanged, alongside the new memory. A safe future
compatibility approach (not done, needs a lore decision first): feed it the same `memory_key` queries so Admin recall of
Eva's conversations uses keyed, most-recent-first data, leaving the lore wording and the verification rules intact.

## Settings

| Setting | Default | Meaning |
| --- | --- | --- |
| `IRIS_PERSISTENT_MEMORY` | `on` | `off` stops reading stored conversations (they are still saved) |
| `IRIS_MEMORY_BUDGET_CHARS` | `3000` | most stored conversation added to a request |
| `IRIS_MEMORY_RETENTION_DAYS` | `0` | `0` never; a number removes relationship records unseen that long (opt-in) |

## Cost and speed

No additional OpenAI requests. Measured with realistic message sizes (about 4 characters per token, gpt-4o list price
$2.50 per million input tokens):

| Addition | Tokens | Cost per request |
| --- | --- | --- |
| Recent context (12 messages), first 3 messages of a returning visitor's chat | about 680 | about $0.0017 |
| Recall block (6 matches) on a recall question | about 380 | about $0.0010 |
| Recall with nothing found | about 150 | about $0.0004 |
| Honesty line in the permanent prompt (every request, cacheable) | about 90 | about $0.0002 |

A 10-message chat by a returning visitor with one recall question adds about 3,300 input tokens, roughly $0.008.
A first-time visitor adds only the honesty line. Each lookup is one to three bounded indexed queries (milliseconds on Neon).
Iris Controls shows the counts and an estimate for the identity under test.

## Rollback

- Instant, no deploy: set `IRIS_PERSISTENT_MEMORY=off` in Render (saving continues; reading stops).
- Code: redeploy the previous commit. The new column and tables are additive and harmless to older code.
- Nothing is deleted by deploying or rolling back.

## Limits

- Anonymous memory is only as private as the browser's id: anyone holding that id is that visitor. Signing in is stronger.
- The search is keyword and time based, not semantic; a question that shares no words with what was said may miss it.
- Recent changes and retrieval counts in Iris Controls live in server memory and reset on restart.
- The administrator's earlier chats saved before this feature have no key; adopt them from Iris Controls.
