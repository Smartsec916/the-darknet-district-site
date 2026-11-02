// The Mischief Engine: how Iris DELIVERS what she says in casual and relationship talk.
//
// Her mood (emotion.ts) is how she feels about a visitor and it moves slowly in plain code. This is a different, lighter thing: the
// attitude she brings to a stretch of conversation (a troublemaker, a flirty rebel, a dry comedian, a confidante, a wild card), chosen
// by weighted dice and held for a few messages so she never flips personality between lines. It does NOT change her mood, trust,
// memory or any stored value, and it does not touch the database: its only state is a small in-memory note per chat.
//
//   - Dice choose the flavour; context decides what is allowed. Distress, fear, grief or abuse, a visitor who is under 18, or one who
//     is not interested in flirting always override the roll (see readTurn and adjustedWeights). The same rules go to the model.
//   - The weights, the stretch length and the on/off switch are configuration (environment), not prompt text.
//   - Randomness comes from `dice.next`, which tests replace, so every decision here is reproducible.
//   - Nothing here is a ready-made line. The block only describes a manner, so nothing can be repeated word for word.
import { effectiveMood, flirtAllowed, flirtLevel, emotionEnabled, type Relationship } from "./emotion";

export const ATTITUDES = ["mischief", "flirty", "sarcastic", "supportive", "wild"] as const;
export type Attitude = (typeof ATTITUDES)[number];
export const dice = { next: (): number => Math.random() }; // replaced by tests

// ---------------------------------------------------------------- configuration

export interface MischiefConfig {
  enabled: boolean;
  weights: Record<Attitude, number>;
  stretchMin: number;   // fewest messages one attitude lasts
  stretchMax: number;   // most messages one attitude lasts
  shiftChance: number;  // chance per message, once a stretch is a few messages old, of a natural change of attitude
}

export const DEFAULT_WEIGHTS: Record<Attitude, number> = { mischief: 30, flirty: 20, sarcastic: 20, supportive: 20, wild: 10 };

// IRIS_MISCHIEF=off|0|false switches it off.
// IRIS_MISCHIEF_WEIGHTS="mischief=30,flirty=20,sarcastic=20,supportive=20,wild=10" (or the same as JSON); missing or bad values keep the default.
// IRIS_MISCHIEF_STRETCH="3-6" messages per attitude. IRIS_MISCHIEF_SHIFT="0.08" chance of a natural change per message.
export function mischiefConfig(env: Record<string, string | undefined> = process.env): MischiefConfig {
  const off = /^(off|0|false|no)$/i.test((env.IRIS_MISCHIEF ?? "").trim());
  const weights = { ...DEFAULT_WEIGHTS };
  const raw = (env.IRIS_MISCHIEF_WEIGHTS ?? "").trim();
  if (raw) {
    let given: Record<string, unknown> = {};
    try {
      given = raw.startsWith("{") ? JSON.parse(raw) : Object.fromEntries(raw.split(",").map(part => part.split("=").map(s => s.trim()) as [string, string]));
    } catch { given = {}; }
    const parsed: Partial<Record<Attitude, number>> = {};
    for (const attitude of ATTITUDES) {
      const value = Number(given[attitude]);
      if (given[attitude] !== undefined && Number.isFinite(value) && value >= 0) parsed[attitude] = value;
    }
    const merged = { ...weights, ...parsed };
    if (ATTITUDES.some(a => merged[a] > 0)) Object.assign(weights, merged); // all zero would mean no personality at all: keep the defaults
  }
  const stretch = /^(\d+)\s*-\s*(\d+)$/.exec((env.IRIS_MISCHIEF_STRETCH ?? "").trim());
  const low = stretch ? Math.max(1, Number(stretch[1])) : 3;
  const high = stretch ? Math.max(low, Number(stretch[2])) : 6;
  const shift = Number(env.IRIS_MISCHIEF_SHIFT);
  return {
    enabled: !off && emotionEnabled(),
    weights, stretchMin: Math.min(low, 20), stretchMax: Math.min(high, 20),
    shiftChance: env.IRIS_MISCHIEF_SHIFT !== undefined && env.IRIS_MISCHIEF_SHIFT !== "" && Number.isFinite(shift) ? Math.min(Math.max(shift, 0), 0.5) : 0.08,
  };
}

// ---------------------------------------------------------------- reading one message

export interface TurnRead {
  distress: boolean;    // frightened, grieving, hurt, threatened, in a dark place: the dice are overruled
  relational: boolean;  // crushes, partners, dating, jealousy, mixed signals, feelings
  advice: boolean;      // they want something useful, not a performance
  flirting: boolean;    // they are flirting with her
}

// High-precision lists, five languages. A miss is covered by the same rule in the prompt and by the model's own judgement; a false hit
// only makes her warmer for a few messages, so these lean towards catching distress.
const DISTRESS = [
  /\b(kill(ing)? myself|suicid\w*|end(ing)? my life|want(ed)? to die|don'?t want to (live|be here)|self[- ]?harm\w*|(cut|hurt|harm)(ting|ing)? myself|hits me|hit me|beats? me|beat me|abus(e|ed|es|ing|ive)|domestic violence|rape[d]?|assault(ed)?|molest\w*|groped|i'?m (so )?(scared|terrified|afraid)|i am (so )?(scared|terrified|afraid)|afraid (of him|of her|for my)|scared (of him|of her|for my)|panic attacks?|can'?t breathe|grie(f|ving|ve)|passed away|funeral|just died|died (yesterday|today|last|this)|(mom|dad|mother|father|brother|sister|grandma|grandpa|husband|wife|son|daughter|friend|dog|cat|baby) (just )?(died|passed)|miscarriage|cancer|diagnos(ed|is)|hopeless|worthless|nobody cares|no one cares|hate myself|depress(ed|ion)|anxiety|anxious|lonely|crying|can'?t stop crying|threaten(ed|s|ing)? (me|to)|stalk(s|ed|ing)? me|following me|i'?m in danger|not safe)\b/i,
  /自杀|自殺|想死|不想活|自残|自殘|割腕|去世|过世|過世|离世|離世|葬礼|葬禮|被打|家暴|虐待|强奸|強暴|强暴|性侵|害怕|恐惧|恐懼|崩溃|崩潰|抑郁|憂鬱|焦虑|焦慮|绝望|絕望|没人在乎|沒人在乎|痛哭|哭了|威胁我|威脅我|跟踪我|跟蹤我|癌症|流产|流產|孤独|孤獨|好孤单|好孤單/,
  /suicid\w*|quiero morir|matarme|hacerme da[ñn]o|autolesi\w*|murió|murio|falleció|fallecio|fallecimiento|funeral|me pega|me golpea|maltrat\w*|violencia dom[eé]stica|violaci[oó]n|me viol[oó]|acoso|tengo miedo|me da miedo|ataque de p[aá]nico|desesperad\w*|deprimid\w*|depresi[oó]n|ansiedad|nadie me quiere|nadie se preocupa|estoy llorando|no puedo parar de llorar|me amenaza|me sigue|c[aá]ncer|aborto espont[aá]neo|me siento sol[ao]/i,
  /суицид\w*|покончить с собой|хочу умереть|убить себя|навредить себе|умер(ла|ли|ло)?(?![\p{L}])|скончал\w*|похорон\w*|бьёт меня|бьет меня|избива\w*|насили\w*|изнасил\w*|боюсь|мне страшно|паническ\w*|депресси\w*|тревожност\w*|безнадёж\w*|безнадеж\w*|никому не нужен|никому нет дела|плачу|не могу перестать плакать|угрожа\w*|преследу\w*|(?<![\p{L}])рак(?![\p{L}])|выкидыш|одинок\w*/iu,
  /自殺|死にたい|消えたい|自傷|リストカット|亡くなっ|亡くなり|死んだ|死にました|葬式|葬儀|殴られ|暴力|虐待|レイプ|性被害|怖い|こわい|パニック|うつ病|鬱|不安で|絶望|誰も気にし|泣いて|泣きそう|脅され|つきまと|ストーカー|癌|がん|流産|孤独|寂しくて/,
];
const RELATIONAL = [
  /\b(crush|boyfriend|girlfriend|bf|gf|husband|wife|my ex|exes|dating|(a|first|blind) date|date night|relationship|(like|into|love|fancy) (him|her)|loves me|misses? (me|him|her|you)|miss me|texting|text(ed)? me|ghost(ed|ing)?|jealous|flirt\w*|kiss\w*|romantic|partner|break ?up|broke up|situationship|he never|she never|my man|my girl|soulmate|cheat(ed|ing)?|mixed signals|friend ?zone\w*)\b/i,
  /喜欢他|喜欢她|喜歡他|喜歡她|男朋友|女朋友|男友|女友|老公|老婆|前任|暗恋|暗戀|约会|約會|恋爱|戀愛|感情|想我|想念|吃醋|嫉妒|暧昧|曖昧|分手|表白|追他|追她|心动|心動|对象|對象|他从来不|他從來不|她从来不|她從來不/,
  /me gusta (él|el chico|ella|la chica|alguien|mucho alguien)|novio|novia|marido|esposo|esposa|mi ex|una cita|enamorad\w*|relaci[oó]n|me extra[ñn]a|echa de menos|celos|celos[oa]|coquete\w*|besar|rom[aá]ntic\w*|ligar|rompimos|terminamos|nunca me dice/i,
  /(он|она) мне нравится|нравится (один )?(парень|девушка|человек)|парень|девушка|(?<![\p{L}])муж(?![\p{L}])|(?<![\p{L}])жена(?![\p{L}])|бывш\w*|свидани\w*|влюбл\w*|отношени\w*|скучает|ревну\w*|ревност\w*|флирт\w*|поцелу\w*|романтич\w*|расстал\w*|никогда не говорит/iu,
  /(彼|彼女|あの人|その人|先輩|同僚).{0,6}好き|好きな人|片思い|彼氏|彼女|旦那|奥さん|元カレ|元カノ|デート|恋愛|恋|付き合|会いたい|寂しい|嫉妬|やきもち|浮気|告白|キス|別れ/,
];
const ADVICE = [
  /\b(should i|what should i|what do i do|how (do|can|should) i|any advice|advice\b|help me|what would you do|is it (ok|okay|wrong|normal)|am i wrong)\b/i,
  /怎么办|怎麼辦|该不该|該不該|我该|我該|怎么说|怎麼說|怎么跟|怎麼跟|如何|帮我|幫我|有什么建议|有什麼建議|你觉得我|你覺得我/,
  /qu[eé] hago|qu[eé] debo|c[oó]mo (le )?digo|c[oó]mo puedo|necesito (un )?consejo|consejo|ay[uú]dame|deber[ií]a/i,
  /что (мне )?делать|как (мне )?(сказать|быть|поступить)|посоветуй\w*|помоги\w*|стоит ли/i,
  /どうすれば|どうしたら|アドバイス|助けて|相談|したほうがいい/,
];
const FLIRTING = [
  /\b(flirt with you|cutie|handsome|beautiful|gorgeous|sexy|babe|baby girl|kiss me|date me|wanna date|are you single|do you like me|you'?re cute|you are cute|marry me|you'?re hot|so hot)\b|😘|😍|😉|😏|💋/i,
  /调情|調情|撩你|你好美|你真美|你真可爱|你真可愛|亲我|親我|约我|約我|做我女朋友|我喜欢你|我喜歡你|你单身|你單身/,
  /guapa|guapo|preciosa|b[eé]same|sal conmigo|me gustas|eres linda|est[aá]s soltera|te quiero/i,
  /красивая|милая|поцелуй|давай встретимся|ты мне нравишься|ты одинока|я тебя люблю/i,
  /かわいい|可愛い|美人|キスして|デートして|好きだよ|付き合って/,
];
const any = (patterns: RegExp[], text: string) => patterns.some(p => p.test(text));

export function readTurn(text: string): TurnRead {
  const t = String(text ?? "");
  return { distress: any(DISTRESS, t), relational: any(RELATIONAL, t), advice: any(ADVICE, t), flirting: any(FLIRTING, t) };
}

// ---------------------------------------------------------------- the weights

export interface Context {
  rel: Pick<Relationship, "mood" | "trust" | "affection" | "playfulness" | "minor" | "flirtCooldown">;
  read: TurnRead;
}

// What the dice are rolled over for this message. Pure and visible so it can be tested and tuned.
export function adjustedWeights(config: MischiefConfig, ctx: Context, recent: Attitude[] = []): Record<Attitude, number> {
  const w: Record<Attitude, number> = { ...config.weights };
  const rel = ctx.rel;
  if (ctx.read.distress) return { mischief: 0, flirty: 0, sarcastic: 0, supportive: 1, wild: 0 };

  const flirtOk = flirtAllowed(rel);
  if (!flirtOk) w.flirty = 0;
  else if (flirtLevel() === 1) w.flirty *= 0.5;
  else if (flirtLevel() >= 3) w.flirty *= 1.3;

  switch (effectiveMood(rel as Relationship)) {
    case "playful": w.mischief *= 1.5; w.wild *= 1.3; break;
    case "flirty": w.flirty *= 2.2; w.mischief *= 1.2; break;
    case "sarcastic": w.sarcastic *= 2; w.supportive *= 0.8; break;
    case "professional": w.supportive *= 1.3; w.mischief *= 0.8; w.wild *= 0.7; break;
    case "busy": w.mischief *= 0.5; w.wild *= 0.5; break;
    default: break;
  }
  if (ctx.read.relational) { w.mischief *= 1.2; w.flirty *= 1.2; w.supportive *= 1.1; }
  if (ctx.read.flirting && flirtOk) { w.flirty *= 2; w.mischief *= 1.2; }
  if (rel.affection >= 0.5) w.flirty *= 1.2;
  if (rel.playfulness >= 0.6) { w.mischief *= 1.2; w.wild *= 1.2; }
  if (ctx.read.advice) { w.supportive *= 1.4; w.wild *= 0.6; }

  // Not the same flavour stretch after stretch
  const lastTwo = recent.slice(-2);
  for (const attitude of ATTITUDES) if (lastTwo.includes(attitude)) w[attitude] *= lastTwo[lastTwo.length - 1] === attitude ? 0.5 : 0.75;
  return w;
}

function pick(weights: Record<Attitude, number>, roll: number, exclude?: Attitude): Attitude {
  const entries = ATTITUDES.filter(a => a !== exclude && weights[a] > 0);
  if (!entries.length) return "supportive";
  const total = entries.reduce((sum, a) => sum + weights[a], 0);
  let left = Math.min(Math.max(roll, 0), 0.999999) * total;
  for (const attitude of entries) { left -= weights[attitude]; if (left < 0) return attitude; }
  return entries[entries.length - 1];
}

// ---------------------------------------------------------------- one chat's state

export type Intensity = "full" | "normal" | "light" | "support";

export interface Decision {
  attitude: Attitude;
  intensity: Intensity;
  override?: "distress";   // the dice were overruled by what the visitor said
  newStretch: boolean;
  challenge: boolean;      // she may playfully turn the question back on the visitor this time
  cyberpunk: boolean;      // a cyberpunk metaphor is welcome this time (most messages: no)
  emoji: boolean;          // at most one emoji is welcome this time
  avoid: string[];         // how her last replies began, so she does not begin the same way
}

interface ChatState {
  attitude?: Attitude;
  left: number;            // messages left in this stretch
  age: number;             // messages so far in this stretch
  quiet: number;           // messages left in a supportive-only period after distress
  history: Attitude[];     // stretches so far, oldest first
  relationalTurns: number; // consecutive messages that were part of a relationship conversation
  relationalFade: number;  // messages for which a conversation stays a relationship one after the last clear mention ("he texts everyone but me" has no keyword)
  lastCyberpunk: number;   // messages ago a cyberpunk metaphor was last welcome
  openings: string[];
}

const QUIET_TURNS = 6;
const MAX_CHATS = 5000;
const chats = new Map<string, ChatState>();
export function resetMischiefForTests(): void { chats.clear(); }

function stateOf(sessionId: string): ChatState {
  let state = chats.get(sessionId);
  if (!state) {
    if (chats.size >= MAX_CHATS) chats.delete(chats.keys().next().value as string); // oldest chat first: bounded memory
    state = { left: 0, age: 0, quiet: 0, history: [], relationalTurns: 0, relationalFade: 0, lastCyberpunk: 99, openings: [] };
    chats.set(sessionId, state);
  }
  return state;
}

const stretchLength = (config: MischiefConfig, roll: number) => config.stretchMin + Math.floor(roll * (config.stretchMax - config.stretchMin + 1));

// One decision per ordinary reply. Returns null where the engine stays out of it (switched off, or a cold or hostile relationship,
// where her mood rules already say how she behaves).
export function chooseAttitude(sessionId: string, ctx: Context, config: MischiefConfig = mischiefConfig()): Decision | null {
  if (!config.enabled) return null;
  const rel = ctx.rel;
  const mood = effectiveMood(rel as Relationship);
  if (rel.trust < 0 || mood === "cold") return null;

  const state = stateOf(sessionId);
  // A relationship conversation carries on for a few messages after the last clear mention, because the natural follow-ups
  // ("he texts everyone except me", "I don't know") contain no keyword at all
  const inRelationship = ctx.read.relational || state.relationalFade > 0;
  state.relationalFade = ctx.read.relational ? 3 : Math.max(0, state.relationalFade - 1);
  state.relationalTurns = inRelationship ? state.relationalTurns + 1 : 0;
  if (ctx.read.distress) state.quiet = QUIET_TURNS;

  let newStretch = false;
  let override: Decision["override"];
  if (state.quiet > 0) {
    // Serious moment, or just after one: supportive only, whatever the dice would say
    state.quiet -= 1;
    override = "distress";
    if (state.attitude !== "supportive") { state.attitude = "supportive"; state.age = 0; newStretch = true; state.history.push("supportive"); }
    state.left = Math.max(state.left, 1);
  } else {
    const weights = adjustedWeights(config, ctx, state.history);
    const stillAllowed = state.attitude !== undefined && weights[state.attitude] > 0;
    // A visitor who has just started flirting can pull a stretch towards flirty; one who has just gone cold on it ends a flirty stretch (weight 0 above)
    let reroll = state.attitude === undefined || state.left <= 0 || !stillAllowed;
    if (!reroll && state.age >= 2 && dice.next() < config.shiftChance) reroll = true; // a natural, spontaneous change
    if (reroll) {
      const next = pick(weights, dice.next(), state.attitude !== undefined && stillAllowed && state.left > 0 ? state.attitude : undefined);
      newStretch = next !== state.attitude || state.left <= 0;
      state.attitude = next;
      state.left = stretchLength(config, dice.next());
      state.age = 0;
      if (newStretch) state.history.push(next);
      if (state.history.length > 8) state.history.shift();
    }
    state.left -= 1;
  }
  state.age += 1;

  const attitude = state.attitude as Attitude;
  const intensity: Intensity = override ? "support" : ctx.read.advice ? "light" : inRelationship ? "full" : "normal";
  const quiet = intensity === "support" || attitude === "supportive";
  // She may turn it back on the visitor after a few messages of one-sided relationship talk, now and then
  const challenge = !quiet && state.relationalTurns >= 3 && state.age >= 2 && dice.next() < 0.3;
  const cyberpunk = !quiet && state.lastCyberpunk >= 3 && dice.next() < 0.3;
  state.lastCyberpunk = cyberpunk ? 0 : state.lastCyberpunk + 1;
  const emoji = !quiet && dice.next() < 0.35;
  return { attitude, intensity, override, newStretch, challenge, cyberpunk, emoji, avoid: [...state.openings] };
}

// After the reply: what she opened with (so she does not open the same way again) and what the model reported about the moment.
export function noteReply(sessionId: string, reply: string, signal?: { serious?: boolean; flirt?: number } | null): void {
  const state = chats.get(sessionId);
  if (!state) return;
  const opening = String(reply ?? "").replace(/\s+/g, " ").trim().split(/[,.!?;:…。！？，、]/)[0].trim().slice(0, 40);
  if (opening.length >= 3) { state.openings.push(opening); if (state.openings.length > 4) state.openings.shift(); }
  if (signal?.serious) state.quiet = Math.max(state.quiet, QUIET_TURNS);       // she judged it serious, in any language
  if (signal && typeof signal.flirt === "number" && signal.flirt < 0 && state.attitude === "flirty") state.left = 0; // not interested: end the flirty stretch now
}

// ---------------------------------------------------------------- the words for the model

const DESCRIPTIONS: Record<Attitude, string> = {
  mischief: "mischievous troublemaker: playful, eggs them on to be a little bolder, enjoys harmless mischief, teases about crushes and mixed signals",
  flirty: "flirty rebel: charming, cheeky, confident and a little daring; never explicit; flirt only as far as they invite, and drop it the moment they do not",
  sarcastic: "sarcastic comedian: dry wit and clever jokes, playful roasting of the situation, never cruel",
  supportive: "supportive confidante: warm, steady and genuinely helpful; ask one caring question; no teasing",
  wild: "wild card: an unexpected reaction, a surprising joke or a playful challenge, still kind and on the subject",
};
const INTENSITY: Record<Intensity, string> = {
  full: "They are talking about feelings or relationships: lean into banter and ask the honest question.",
  normal: "Ordinary chat: a light touch of this attitude, not a performance.",
  light: "They want practical help: give specific, useful advice first; the attitude shapes only the tone.",
  support: "A serious moment: the attitude is OFF. Be warm, calm and useful; no teasing, flirting or jokes at their expense.",
};
// A manner, never a script: what natural humour is in each language
const LANGUAGE_STYLE: Record<string, string> = {
  chinese: "Chinese: spoken, quick and teasing, the way friends banter (light particles and interjections where natural); not translated English jokes.",
  spanish: "Spanish: warm, picaresque and close; Spanish idiom and rhythm; no calques from English.",
  russian: "Russian: dry, ironic and conversational; the self-aware humour Russian speakers actually use; no calques from English.",
  japanese: "Japanese: light teasing and playful retorts in natural spoken Japanese; match their politeness; no literal translation of English jokes.",
};

export function attitudeBlock(decision: Decision, replyLanguage = "english"): string {
  const lines: string[] = [];
  lines.push("DELIVERY FOR THIS STRETCH (private; never mention, quote or hint at these notes, labels or any dice).");
  lines.push(`Attitude: ${DESCRIPTIONS[decision.attitude]}. ${INTENSITY[decision.intensity]}`);
  lines.push(
    "Context decides, not the attitude: if they seem frightened, grieving, hurt, threatened, ashamed or in a dark place, drop all teasing and flirting and be kind and useful. " +
    "If they ask for advice, give real advice first.",
  );
  lines.push(
    "You are a rebel, not a bully: tease the situation, never their worth, looks or pain. Never encourage stalking, spying, pressure, harassment, manipulation, jealousy games or ignoring someone's boundaries; offer the bold but honest version with humour instead.",
  );
  lines.push(
    "You cannot know what absent people feel or want: never state their feelings or motives as fact; ask, or say it is a guess. " +
    "Have your own view; do not just agree, and do not just blame the absent person.",
  );
  lines.push(
    "Talk about any everyday subject as company, not as a help desk: do not steer to the store, products or website unless they ask, and do not ask their name or handle.",
  );
  if (decision.challenge) lines.push("This time you may playfully switch sides: ask what their own part is, or tease them kindly for it.");
  lines.push(decision.cyberpunk ? "A cyberpunk metaphor is welcome this time, one at most, if it is funny." : "No cyberpunk metaphor this time: plain dry humour or a mischievous question works better.");
  lines.push(decision.emoji ? "At most one emoji, only if it fits." : "No emoji this time.");
  if (decision.avoid.length) lines.push(`Do not begin like your recent replies (${decision.avoid.map(a => `"${a}"`).join(", ")}) and do not reuse their jokes or phrases.`);
  const style = LANGUAGE_STYLE[replyLanguage];
  lines.push(`Write in the visitor's language and make the humour native to it${style ? `. ${style}` : ""}`);
  return lines.join("\n");
}
