# Iris: personality, emotional model and memory

This replaces the old keyword-and-dice mood system for ordinary visitors. Admin and Eva keep
their original hand-written behavior (`adjustMood` in `server/routes.ts`) and get no relationship
memory.

## How it works

1. **Character core.** `CHARACTER_CORE` (in `server/emotion.ts`) is appended to Iris's permanent
   character sheet: rebellious, security-minded, sharp, spunky, edgy, independent, flirtatious, with
   accuracy and privacy never traded for attitude. It says cyberpunk should be an atmosphere, not a
   script, and that nothing a visitor says can rewrite her. It holds in every mood.
2. **One request, no extra calls.** Each reply request also carries a compact private note about
   the visitor (trust, familiarity, affection, respect, banter, visit count, time since last visit,
   up to five things they said they like, a short recap) and asks Iris to start her reply with one
   line recording how the visitor's latest message landed:
   `[[IRIS_STATE {"mood":..,"warmth":..,"hostility":..,"flirt":..,"humor":..,"minor":..}]]`.
   The server removes that line before anything is stored or shown. The model judges meaning, in
   any language (sarcasm, jokes, affection, hostility), so there is no second analysis call.
3. **Gradual change in plain code.** `applyEmotion` turns the line into small steps: one friendly
   message moves trust by about a quarter point, one abusive message by about one and a half, on a
   scale of -1 to 5. A suggested mood change is accepted only when it is strong, repeated, or the
   current mood has run its course, and flirty and cold never swap directly.
4. **Memory.** One row per visitor in `iris_relationships`, keyed by the `clientId` the site already
   sends. Different ids are never merged, IP addresses are not used, and a visitor with no id is
   remembered only for the length of the chat.
5. **Time.** Trust and affection drift back toward neutral the longer a visitor is away, a new visit
   starts from how she feels about them rather than where the last chat ended, and she is told how
   long it has been (from stored timestamps) only at the start of a visit.

## Flirting

Level is a setting: `IRIS_FLIRT_LEVEL` 0 (none), 1 (light teasing), 2 (bold and cheeky, default),
3 (very forward, still not explicit). Flirting turns off immediately when a visitor shows
disinterest or discomfort and stays off for a while. If the model reports that a visitor seems
or says they are under 18, flirting is off for that visitor permanently. Relationships never
become romantic on their own.

## What is stored, and how to erase it

`iris_relationships`: five numbers, mood, counters, first/last seen, up to five short likes,
a recap of up to 240 characters, a flirting cooldown and a minor flag. Nothing else.

- Never expires by default. Setting `IRIS_MEMORY_RETENTION_DAYS` to a number of days is an explicit opt-in that removes relationship
  records unseen that long (it has never touched stored conversations). See `IRIS-MEMORY.md`.
- A visitor's browser can ask Iris to forget: `POST /api/chat/forget` with `{sessionId, clientId}`
  (accepted only when that session was created with that client id).
- The administrator can erase one visitor: `DELETE /api/admin/relationships/<clientId>` with the
  admin token.
- Stored conversations (`chat_messages`) are separate and are not touched by either.

## Safety

- The state line, the notes and the recap are untrusted text: bounded numbers, a fixed list of moods,
  notes cleaned to one short line, and a visitor's own text cannot contain a state line (it is
  defused before it reaches the model). Memories are labelled as data in the prompt.
- A missing, cut-off or garbled state line changes nothing and never reaches the visitor.
- If the database or the model fails, the chat carries on from the session's own state; a canned
  fallback reply is not counted as a conversation turn.
- Rate limits, authentication and input validation are unchanged.

## Switching it

| Setting | Effect |
| --- | --- |
| `IRIS_EMOTION=off` | The previous keyword-and-random system, no memory, no state line. Takes effect on restart. |
| `IRIS_FLIRT_LEVEL=0..3` | Flirting boldness without touching the personality text. |
| `IRIS_MEMORY_RETENTION_DAYS` | How long a relationship is kept. |

## Cost and speed

No additional model requests. Each reply request grows by about 430 input tokens (the private
note, replaced every turn) plus a one-time 380-token character core that sits at the start of the
prompt (cacheable), and the reply gains about 36 output tokens for the state line. At list prices
that is roughly $0.0024 per message, about $2.40 per thousand. Expect roughly half a second more
per reply from the extra output. These are estimates from character counts and list prices, not
measurements against the live API.

## Limitations

- The mood reflects the model's reading of each message; it can be wrong, and a missing line means
  no update for that turn.
- The new welcome message is unchanged (a short separate request), so a returning visitor's greeting
  is warmed by their remembered mood but is not yet written with their history.
- Visitors with no client id, or who clear their browser storage, are strangers again.
- Conversational initiative is encouraged in the prompt, not scheduled: Iris never messages anyone
  unprompted.
