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

## Reply language

Each message is detected on its own and that detection is what is stored with it (so the admin viewer is unchanged). The language of
the reply comes from the conversation's **default language** (`server/language.ts`):

- a message clearly in another language moves the default; a short or ambiguous English message ("ok", "thanks", "hello") does not;
- a clear English sentence moves it back to English;
- explicit requests are always honored: translate (one reply, the default stays), answer in two languages (one reply), or switch
  language (the new default);
- after a restart the default is rebuilt from the language already stored with the visitor's own messages in that chat (no new
  column or table); a visitor with no memory identity (New Visitor mode) starts from English again;
- the model reads one short `LANGUAGE:` note after the conversation (before the recall rule). It allows names and District or game
  terms in English and never forbids a requested translation.

## The Mischief Engine (delivery in casual and relationship talk)

Her mood (above) is how she feels about a visitor, and it moves slowly. The Mischief Engine (`server/mischief.ts`) is a lighter layer on top: the **attitude** she brings to a stretch of conversation. It changes how she says things, not what she knows or how she feels, so it never changes her mood, trust, memory or anything stored, and it adds no table or column.

**Attitudes and starting weights** (adjustable, see below):

| Attitude | Weight | Manner |
| --- | ---: | --- |
| Mischievous troublemaker | 30 | playful, eggs them on to be a little bolder, teases about crushes and mixed signals |
| Flirty rebel | 20 | charming, cheeky, a little daring, never explicit, only as far as they invite |
| Sarcastic comedian | 20 | dry wit, playful roasting of the situation, never cruel |
| Supportive confidante | 20 | warm, steady, genuinely helpful, one caring question |
| Wild card | 10 | an unexpected reaction, a surprising joke or a playful challenge |

**How it works**

- One attitude is chosen by weighted dice and **held for a stretch** of 3 to 6 messages, so she never flips personality between lines. Now and then (8% per message, never in a stretch's first two messages) it changes on its own.
- **Context bends the odds, and decides what is allowed.** Her mood, how much the visitor flirts, relationship talk (which carries on through follow-ups with no keyword, for three messages) and a request for advice all shift the weights. Flirty is removed for anyone under 18 or who showed disinterest (the existing minor flag and cooldown), and when `IRIS_FLIRT_LEVEL=0`. A cold or hostile relationship gets no attitude at all: her mood rules decide.
- **Distress overrules the dice.** Messages about fear, grief, abuse, self-harm or a dark place (lists in English, Chinese, Spanish, Russian and Japanese, plus the model's own `"serious"` flag in the state line for any other language) force the supportive attitude, with no teasing, flirting, jokes or metaphors, for that message and the next five. She also does not demand a name or handle in such a moment.
- **Advice first.** If they ask for advice she gives real, specific advice; the attitude only shapes the tone.
- **Rebel, not bully.** The model is told to tease the situation, never a person's worth, looks or pain; never to encourage stalking, spying, pressure, harassment, manipulation or jealousy games; never to state an absent person's feelings as fact; to have her own view; and, after a few messages of one-sided relationship talk, now and then to playfully turn the question back on the visitor.
- **Variety.** She is an android in every reply: her machine worldview (processors, networks, signals, circuitry, sensors, encryption, systems) is how she sees things, and the engine only decides how loudly it speaks: clearly on about six messages in ten (one or two fresh technical images in her own words, never a pile and never a phrase she used before), lightly on the rest (a word, or none, but still not human), never in a serious moment. About half of her replies end on a witty statement, not a question, and two question endings in a row force a statement. At most one emoji, only sometimes. How her last four replies began is passed back as "do not begin like this". Humour is asked to be written natively in the visitor's language (short style notes for Chinese, Spanish, Russian and Japanese), not translated.
- The block is private: it is never shown, stored or returned to the visitor.

**Where it does not apply:** live data (weather, earthquakes, news; those keep their own commentary stance), time answers, memory answers, and the Admin and Eva special users.

**Configuration** (environment; nothing needs a prompt rewrite):

| Setting | Effect |
| --- | --- |
| `IRIS_MISCHIEF=off` | Switches the engine off (also off when `IRIS_EMOTION=off`). |
| `IRIS_MISCHIEF_WEIGHTS` | `mischief=30,flirty=20,sarcastic=20,supportive=20,wild=10` (or the same as JSON). Missing keys keep their default; all zero is ignored. |
| `IRIS_MISCHIEF_STRETCH` | Messages per attitude, default `3-6`. |
| `IRIS_MISCHIEF_SHIFT` | Chance of a natural change per message, default `0.08`. |

**Cost:** one more private system message of about 550 tokens per ordinary reply in English, up to about 720 in Chinese with the recent-word lists (replaced every turn, never stacked), roughly $0.0012 per message at list prices (estimated from character counts, not measured against the live API). No extra model request.

**Customer-service drift (fixed):** the permanent prompt used to say her PRIMARY JOB and MAIN PURPOSE were to inform users about the website and store, to promote merchandise, to reference the website "frequently", and to ALWAYS ask for a name (and ask again by the third message). That is why she sometimes answered a personal message with "I mainly help with products, events and the website", and why she kept asking for a handle. It now says she is good company first, helps with the District when asked, mentions merchandise only when relevant, and may ask a name once, naturally. Emoji changed from "never" to "rarely, at most one, never in a serious moment".

**Limitations:** the engine and the rules are tested with a stand-in model; how well the real model follows them (humour quality, tone, other languages) is judged by reading real replies (`node scripts/live-model-eval.mjs --suite personality`, which costs API credit). Distress detection by word list misses languages and phrasings it does not cover, which the model's `"serious"` flag and the rules in the prompt are there to catch. The engine's state lives in memory, so a server restart starts a new stretch.

**Android worldview (correction to the first tone pass).** The first real-model evaluation showed English replies piling on technology metaphors, and a first tone pass removed too much: it made cyberpunk "the exception" and asked for an ordinary woman's voice. That was wrong for the character. Iris is a sophisticated, intelligent, rebellious female android, and her hacker and technical vocabulary and machine-oriented thinking are fundamental, so the permanent style list, the character core and the per-turn variety blocks now say so again: processors, networks, signals, circuitry, sensors, encryption and systems are her worldview, not decoration. What stays from the tone pass is the part that was right: never repeat a favourite phrase or stock metaphor from recent replies, no piles, no stock greeting lists, flirting that is never explicit, and not ending every reply on a question. The evaluation script now measures android identity directly (`scripts/android-identity.mjs`): how many replies show a machine-worldview word in each of English, Chinese, Japanese, Spanish and Russian, whether any reply piles four or more, which word is most repeated, whether the "what do you do here?" answer names her as an android, and how many replies end on a question or a statement. Mood-specific greeting prompts (used only for the welcome message) are unchanged.

**Variety and cleanup (follow-up to the android-worldview correction).** The third evaluation brought the android identity back but showed recycled favourites ("circuit" in 4 of 6 English replies, "алгоритм" in 3 of 6 Russian ones), "Ah," opening several replies, three replies stacking four or more images, a flat Chinese voice with help-desk closers and an English nickname dropped into Chinese sentences, and one Japanese reply ending in a stray Chinese phrase. Changes, none of which lowers how much of an android she is:
- **Recent technical words.** The engine remembers the technical words (`server/machineWords.ts`, the same list the evaluation measures with, kept identical by a test) in her last two replies and tells her to reach for different ones. Her machine side stays on: clear on about six messages in ten, light on the rest, off only in a serious moment.
- **Short openings.** Openings of two letters ("Ah", "Ok") and a single Chinese or Japanese character ("唉", "啧") are now remembered and passed back as "do not begin like this".
- **One image, not a stack.** The clear-machine instruction asks for one well-chosen technical image, two at most; the permanent style says usually one reference per reply.
- **Simplified Chinese voice.** A witty, mischievous, rebellious android who talks like a sharp friend, not a service bot: short punchy sentences, 吐槽 and deadpan understatement, a fresh interjection each time, never customer-service phrasing (您, 请问, 有什么可以帮您, 随时找我), no English words such as netrunner inside Chinese sentences, machine humour that sounds like Chinese humour (处理器, 信号, 带宽, 死机, 重启, 防火墙, 加密).
- **No generic closing offers, one language per reply.** The prompt says so, and `server/replyPolish.ts` enforces it for ordinary engine turns by removing, sentence by sentence and only ever removing: a sentence in the wrong language (kana in a Chinese reply, Chinese-only characters in a Japanese one, CJK in an English, Spanish or Russian one) and a generic closing offer ("Anything else…?", "有什么我能帮忙的吗？", "何かあれば教えてね", "¿Algo más…?", "Обращайся…"). It never touches a serious moment or a supportive stretch, a visitor who asked what she does or for help, any conversation where the visitor is talking about languages, a script the visitor used themselves, live-data replies, or a reply it would leave empty.
- **Evaluation checks** (`scripts/multilingual-checks.mjs`): foreign-script contamination in every language, English words inside Chinese and Japanese replies, repeated openers including short ones, customer-service phrasing, three-image replies, and a summary of recycled words and replies stacking different images. They are tested against the real third transcript.

**Amendment after the evaluation of the variety version.** The evaluation found one tone slip in serious moments (a Russian reply likening a father's death to "a system fault"; Spanish grief and aftercare leaning on machine wording), a Chinese voice that stacked jargon because its guidance listed example technical words, five of six Chinese replies carrying an emoji, and two closers that slipped past the cleanup (Japanese "いつでもサポートしますよ！", Russian "всегда рада продолжить беседу!"). Changes:
- **Serious moments.** In grief, fear or crisis she is told to speak with natural, plain empathy, with no technical or machine imagery of any kind, about herself or about what happened, never to compare a loss, fear or pain to a system, signal, circuit, error or fault, to stay herself (direct, honest, kind), and, if they may be in danger, to say plainly that their safety comes first and to encourage local emergency help or someone they trust. The permanent style says the same. In ordinary conversation her android side and hacker vocabulary are unchanged.
- **Chinese.** The example vocabulary is removed. She is told to use one technical image at a time, a different one each time, with plenty of replies with none; never to call herself a 助手 or 小助手; and not to repeat the same interjection.
- **Emoji.** The engine already allowed one emoji on about a third of replies, but the model added its own. The cleanup now removes emoji when the engine allowed none and keeps only the first when it allowed one. Serious replies are never touched.
- **Closing offers, made safer.** The cleanup patterns are narrowed to genuine offers of service and extended for Japanese and Russian. Emotional presence ("I'm here for you", "я рядом", "ここにいるよ", "estoy aquí contigo") is never treated as a closer. A whole sentence goes only if it starts with the offer or is short; a long sentence that merely ends with an offer loses only that final clause, so advice in the same sentence stays; advice that merely contains an offer-like phrase ("如果有什么问题让你犹豫…", "Si necesitas una razón…") is untouched.
- **Evaluation.** A \`serious\` suite (grief, a thank-you, and a frightened visitor in every language) with a check for machine imagery in serious replies; the evaluation-only cleanup trace (\`IRIS_POLISH_TRACE=1\`, never set in production) now also records emoji removed.

**Simplified Chinese voice (follow-up).** The evaluation of the amended version showed Chinese had swung from jargon-stacked to a wordy counsellor: 159 characters on average, 5 of 6 replies ending on a question, almost no mischief, and a service-bot closer ("你还有什么想和我聊的吗？"). The Chinese guidance for ordinary conversation is rewritten so she is the same rebellious, mischievous, funny android as in English:
- **Short and punchy:** one to three spoken sentences; react first, then a tease, comeback, dare or deadpan verdict with one clear opinion; take their side and poke a hole in it, or call out what they are really doing.
- **Chinese humour, not translated jokes:** 吐槽, 调侃, 反问, 自嘲 (a dig at being a machine often lands best), 一本正经地胡说八道, cheeky exaggeration.
- **Not a counsellor:** no 我理解你的感受, 听上去…让你…, 这很正常, 沟通是关键, 照顾好自己, no lecture or list of advice.
- **Land the line and stop:** never end on a tag question (是吧, 对吧, 不是吗) or "what do you think?". When the engine asks for a statement ending, the cleanup also trims a trailing Chinese tag question (never in a serious moment).
- **No service bot:** no 您, 请问, 有什么可以帮您, 乐意提供帮助, 尽管开口, 随时找我, never 助手 or 小助手. The cleanup now also catches "你还有什么想和我聊的吗" and "我非常乐意提供帮助".
- **Android and hacker vocabulary stay hers,** one image at a time and without a word list (the list is what caused stacking), a different interjection each time.
- **Serious moments are untouched.** Chinese in a serious moment keeps exactly the guidance it was evaluated with; a fingerprint test (`tests/chinese-voice.test.ts`) proves that 65 of the 75 prompt variants (every other language, and Chinese in a serious moment) are byte-for-byte what was evaluated.
- Cost: about 300 more prompt tokens per ordinary Chinese message (about $0.0008). The evaluation script flags counsellor language, tag-question endings, service-bot phrasing and long replies in Chinese, and reports the average length per language.

**Simplified Chinese voice (revision after the first #171 evaluation).** That evaluation showed jargon stacking and recycling (信号 in 5 of 6 replies, 处理器 in 3) coming from two example lists still in the Chinese prompt, banter that was too long (132 characters on average), a counsellor-voiced advice reply, a surviving service offer ("我这边还能提供些…小建议…你要听吗？") and a breezy "哎呀" opening a reply to grief. Changes, all for ordinary Chinese only:
- **No example word lists** anywhere in the Chinese guidance. The Chinese "machine side" line says one image, from her own body or workings, in the way a Chinese speaker would say it, never a pile, never a repeat; the avoid-list tells her to find a different part of her machine nature.
- **Length guideline:** casual replies usually 40 to 70 Chinese characters, explicitly "a guideline, not a hard limit"; nothing is truncated. Practical advice may run longer but is told to keep the cheeky voice (a tease, a dare, a deadpan line). The advice turn (engine intensity `light`) now gets this line too.
- **Cleanup:** "还能/可以提供…建议/帮助/服务/点子/主意" closers are removed under the existing rules (only a closing sentence or final clause, never advice or banter such as "我有个馊主意，你要听吗？"). In a Chinese reply to grief or fear, a leading breezy interjection (哎呀, 嘿, 哈哈, 哇…) is stripped; nothing else in a serious moment is touched, and the serious-moment prompt text is byte-identical (fingerprint test).
- Evaluation check: advice replies may run up to 180 characters before being flagged; banter stays at 110.

**Simplified Chinese voice (third revision: root causes).** The second #171 evaluation showed `信号` and `系统` recurring although the engine did remember them (checked: the "do not use them again" line was in the prompt; the model ignored it and its own earlier replies kept priming it), banter still long, 4 of 6 replies ending on a hook question, a counsellor advice reply and a service-style role answer. Fixes at the cause:
- **Advice detection** (`ADVICE` in `server/mischief.ts`) was English-heavy; "我要不要告诉男朋友我的感受？" never counted as advice. Chinese, Spanish, Russian and Japanese advice questions are now recognised (要不要, 应不应该, ¿debo…?, стоит ли / надо ли, したほうがいいかな …), so the advice turn really gets the practical-advice voice. English patterns are unchanged.
- **Role questions** ("你在这里是做什么的？", "What do you do here?", ¿Qué haces?, Кто ты?, 何をしているの？) are recognised (never in a serious moment) and get one line: say plainly you are an android, then what you do, not a help-desk description.
- **Machine imagery by rotation, not prohibition.** When her machine side speaks clearly, the engine assigns ONE part of her nature to draw from (power and heat, memory, moving parts, updates and sleep, senses, how she was built), rotated so it is never the same twice in a row (Chinese prompt only; descriptions, not vocabulary). The recent-word memory stays.
- **Hook questions** (Chinese): when the engine chose a statement ending, a closing stock hook ("怎么想？", "有没有点心动？", "好玩吗？", "你觉得呢？") is trimmed, at most two; questions with a question word or real content stay.
- **Length:** ordinary Chinese turns carry a short per-turn line ("about two quick sentences, roughly 40 to 70 characters, unless they asked for an explanation"); advice and role answers are exempt. Nothing is truncated.
- Serious-moment prompt text is unchanged (fingerprint test).
