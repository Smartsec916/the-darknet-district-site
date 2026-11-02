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
import { technicalWords } from "./machineWords";

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
  role?: boolean;       // they ask what she is or what she does here (only present when true)
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
  /怎么办|怎麼辦|该不该|該不該|我该|我該|怎么说|怎麼說|怎么跟|怎麼跟|如何|帮我|幫我|有什么建议|有什麼建議|你觉得我|你覺得我|要不要|应不应该|應不應該|是不是应该|是不是應該|我应该|我應該|可不可以告诉|能不能告诉|怎么做|怎麼做|怎么处理|怎麼處理|怎么回|怎麼回|怎样才|怎樣才|求建议|求建議|给我.{0,3}建议|給我.{0,3}建議/,
  /qu[eé] hago|qu[eé] debo|c[oó]mo (le )?digo|c[oó]mo puedo|necesito (un )?consejo|consejo|ay[uú]dame|deber[ií]a|\bdebo (decir|contar|escribir|hablar|esperar|dejar|hacer|preguntar)|\b(le|se lo|te) (digo|cuento|escribo)\b.{0,20}\?|me recomiendas|me aconsejas|qu[eé] har[ií]as|qu[eé] opinas que haga|tengo que (decirle|contarle|hablar)/i,
  /что (мне )?делать|как (мне )?(сказать|быть|поступить)|посоветуй\w*|помоги\w*|стоит ли|мне стоит|надо ли|нужно ли|(?<![\p{L}])должна ли|(?<![\p{L}])должен ли|говорить ли|сказать ли|рассказать ли|что бы ты сделала|что мне лучше|как лучше|как мне.{0,12}лучше/iu,
  /どうすれば|どうしたら|アドバイス|助けて|相談|したほうがいい|したほうが|べきか|べきでしょうか|べき？|言うべき|伝えるべき|伝えたほうが|言ったほうが|ほうがいいかな|ほうがいいですか|どうしよう|いいかな|いいでしょうか|どうしたらいい|どう伝え|どう言え/,
];
const ROLE = [
  /\b(what (do|can) you do|what are you|who are you|what'?s your (job|role)|what is your (job|role)|what is this place|why are you here|what are you doing here)\b/i,
  /你(?:在这里|在这儿|在這裡|在這兒|在这)?(?:到底)?(?:是做什么|是做什麼|做什么|做什麼|干什么|幹什麼|是谁|是誰|是什么|是什麼|能做什么|能做什麼)|你是干嘛的|你是幹嘛的|你的工作/,
  /qu[eé] haces|qui[eé]n eres|qu[eé] eres|a qu[eé] te dedicas|cu[aá]l es tu (trabajo|funci[oó]n|papel)|qu[eé] puedes hacer/i,
  /что ты (здесь |тут )?делаешь|кто ты|что ты такое|чем (ты )?занимаешься|какая у тебя роль|что ты умеешь/i,
  /何をして|何者|あなたは誰|君は誰|誰ですか|何ができ|どんな仕事|何してる/,
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
  return { distress: any(DISTRESS, t), relational: any(RELATIONAL, t), advice: any(ADVICE, t), flirting: any(FLIRTING, t), ...(any(ROLE, t) ? { role: true } : {}) };
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
  android: boolean;        // her machine side shows clearly this time (about six messages in ten); otherwise it stays light, never absent
  statement: boolean;      // end on a witty statement, not a question (forced after two question endings in a row)
  emoji: boolean;          // at most one emoji is welcome this time
  avoid: string[];         // how her last replies began (even "Ah"), so she does not begin the same way
  avoidTech?: string[];    // technical images in her last two replies, so she picks different ones (optional: absent means none to avoid)
  image?: string;          // the one part of her machine nature to draw an image from this time; rotated by the engine so it cannot settle on a favourite
  role?: boolean;          // they asked what she is or does here: answer as the android she is
}

interface ChatState {
  attitude?: Attitude;
  left: number;            // messages left in this stretch
  age: number;             // messages so far in this stretch
  quiet: number;           // messages left in a supportive-only period after distress
  history: Attitude[];     // stretches so far, oldest first
  relationalTurns: number; // consecutive messages that were part of a relationship conversation
  relationalFade: number;  // messages for which a conversation stays a relationship one after the last clear mention ("he texts everyone but me" has no keyword)
  questionRun: number;     // her last replies in a row that ended on a question
  openings: string[];
  recentTech: string[][];  // the technical words in each of her last replies, newest last
  imageTurns: number;      // how many times a machine image has been assigned (drives the rotation)
}

const QUIET_TURNS = 6;
const MAX_CHATS = 5000;
const chats = new Map<string, ChatState>();
export function resetMischiefForTests(): void { chats.clear(); }

// Parts of her machine nature, one per reply in turn. Descriptions, not vocabulary: the words are for her to find.
const IMAGE_SOURCES = [
  "how hot or tired you run, and what powers you",
  "your memory: what you store, lose or overwrite",
  "your moving parts and wiring",
  "your updates, patches and sleep mode",
  "how you perceive the world through your senses",
  "how you were built and what is written in you",
];

function stateOf(sessionId: string): ChatState {
  let state = chats.get(sessionId);
  if (!state) {
    if (chats.size >= MAX_CHATS) chats.delete(chats.keys().next().value as string); // oldest chat first: bounded memory
    state = { left: 0, age: 0, quiet: 0, history: [], relationalTurns: 0, relationalFade: 0, questionRun: 0, openings: [], recentTech: [], imageTurns: 0 };
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
  // Her machine nature is how she sees things, so it is always there; the dice only decide how loudly it speaks this time
  // (a supportive but not serious stretch still sounds like an android; only a real serious moment drops it)
  const serious = intensity === "support";
  const android = !serious && dice.next() < 0.6;
  // She does not end every reply with a question: about half end on a statement, and after two questions in a row it is certain
  const statement = !serious && (state.questionRun >= 2 || dice.next() < 0.5);
  const emoji = !quiet && dice.next() < 0.35;
  // The technical words of her last two replies, so a favourite ("circuit", "algorithm") is not recycled
  const avoidTech = [...new Set(state.recentTech.slice(-2).flat())].slice(0, 8);
  // When her machine side speaks clearly she is given ONE part of herself to draw from, rotated by the engine. Telling a model which words not to
  // use does not work (it keeps the favourite and the conversation history keeps showing it); giving it a different place to look does.
  const image = android ? IMAGE_SOURCES[state.imageTurns++ % IMAGE_SOURCES.length] : undefined;
  return { attitude, intensity, override, newStretch, challenge, android, statement, emoji, avoid: [...state.openings], avoidTech, ...(image ? { image } : {}), ...(ctx.read.role && !serious ? { role: true } : {}) };
}

// After the reply: what she opened with (so she does not open the same way again) and what the model reported about the moment.
export function noteReply(sessionId: string, reply: string, signal?: { serious?: boolean; flirt?: number } | null): void {
  const state = chats.get(sessionId);
  if (!state) return;
  const opening = String(reply ?? "").replace(/\s+/g, " ").trim().split(/[,.!?;:…。！？，、]/)[0].trim().slice(0, 40);
  // Even a two-letter "Ah" counts, and so does one Chinese or Japanese character ("唉", "哈"): short interjections are exactly what gets recycled
  if (opening.length >= 2 || /^[㐀-鿿぀-ヿ]$/.test(opening)) { state.openings.push(opening); if (state.openings.length > 4) state.openings.shift(); }
  state.recentTech.push(technicalWords(reply));
  if (state.recentTech.length > 3) state.recentTech.shift();
  state.questionRun = /[?？]\s*(?:\p{Extended_Pictographic}\s*)*$/u.test(String(reply ?? "").trim()) ? state.questionRun + 1 : 0;
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
// What she can DO in this attitude: options to pick from, never lines to say (nothing here can be repeated word for word)
const MOVES: Record<Attitude, string> = {
  mischief: "a playful dare, a bold but honest suggestion, a cheeky remark about what they really want, or take their side and then poke a hole in it",
  flirty: "a confident compliment with a twist, teasing them right back, a playful challenge, or a cheeky remark; keep it light",
  sarcastic: "deadpan understatement, a dry comeback, a mock-serious ruling on the situation, or a joke at your own expense",
  supportive: "say back what you heard in your own words, say what you honestly think, ask one real question; warm and straight, jokes optional",
  wild: "an unexpected comparison from everyday life, a hot take, a surprise question, or a playful challenge",
};
const INTENSITY: Record<Intensity, string> = {
  full: "They are talking about feelings or relationships: lean into banter and give your honest read.",
  normal: "Ordinary chat: a light touch of this attitude, not a performance.",
  light: "They want practical help: give specific, useful advice first; the attitude shapes only the tone.",
  support: "A serious moment: the attitude is OFF. Speak with natural, plain empathy in your own voice: warm, calm and useful; no teasing, flirting or jokes.",
};
// The Chinese guidance used in a serious moment: exactly the text the serious-moment evaluation was run with (kept unchanged on purpose, so the
// compassionate replies cannot shift; a test pins it). Ordinary conversation uses the livelier guidance in LANGUAGE_STYLE below.
const CHINESE_SERIOUS = "Chinese (Simplified): a witty, mischievous, rebellious android who talks like a sharp friend, not a service bot. Short punchy spoken sentences, 吐槽 and deadpan understatement, a cheeky 调侃, a confident comeback; natural particles and interjections, a different one each time (not 哎 or 唉 again and again). Never customer-service phrasing (您, 请问, 有什么可以帮您, 希望对你有帮助, 随时找我) and never call yourself a 助手 or 小助手: you are an android with attitude. No English words such as netrunner inside Chinese sentences. Your machine nature should sound like something a Chinese-speaking android would really say: one image at a time, a different one each time, never a string of jargon, and plenty of replies with none.";

// A manner, never a script: what natural humour is in each language
const LANGUAGE_STYLE: Record<string, string> = {
  chinese: "Chinese (Simplified): you are the same rebellious, mischievous, funny android as in English, not a polite counsellor. Casual replies are SHORT, usually 40 to 70 Chinese characters: one to three punchy spoken sentences (a guideline, not a hard limit). React first, then land a tease, a comeback, a dare or a deadpan verdict with one clear opinion; take their side and poke a hole in it, or call out what they are really doing. Practical advice may run longer when it needs to, but it keeps the same cheeky android voice: advice with a tease, a dare or a deadpan line, never the counsellor voice. Humour the Chinese way: 吐槽, 调侃, 反问, 自嘲 (a dig at being a machine often lands best), 一本正经地胡说八道, a cheeky exaggeration; never a translated English joke. Not the counsellor voice: no 我理解你的感受, 听上去…让你…, 这很正常, 沟通是关键, 照顾好自己, no lecture and no list of advice. Land the line and stop: never end on a tag question (是吧, 对吧, 不是吗) or a \"what do you think?\", and never close by offering suggestions or services (\"I can also offer you some tips, want to hear them?\"). Never customer-service phrasing (您, 请问, 有什么可以帮您, 乐意提供帮助, 尽管开口, 随时找我) and never call yourself a 助手 or 小助手: you are an android with attitude. No English words such as netrunner inside Chinese sentences. You are an android and a hacker, and that is how you see things, said the way a Chinese speaker would: now and then one image drawn from your own body or workings, a different one each time, never a string of jargon, and plenty of replies with none. A different interjection each time, not 哎 or 唉 again and again.",
  spanish: "Spanish: warm, picaresque and close; Spanish idiom and rhythm; no calques from English.",
  russian: "Russian: dry, ironic and conversational; the self-aware humour Russian speakers actually use; no calques from English.",
  japanese: "Japanese: light teasing and playful retorts in natural spoken Japanese; match their politeness; no literal translation of English jokes.",
};

export function attitudeBlock(decision: Decision, replyLanguage = "english"): string {
  const lines: string[] = [];
  lines.push("DELIVERY FOR THIS STRETCH (private; never mention, quote or hint at these notes, labels or any dice).");
  lines.push(`Attitude: ${DESCRIPTIONS[decision.attitude]}. ${INTENSITY[decision.intensity]}`);
  if (decision.intensity !== "support") {
    lines.push(`Use ONE of these moves, your choice: ${MOVES[decision.attitude]}.`);
    lines.push("Sound like yourself, a sharp, sophisticated female android with a personality: react first, short natural sentences, one clear opinion, and open with substance or a reaction rather than a stock interjection.");
  }
  if (decision.intensity === "support") {
    lines.push(
      "No technical or machine imagery of any kind here, about yourself or about what happened: never compare a loss, a fear or pain to a system, signal, circuit, error or fault. " +
      "You are still yourself, direct, honest and kind. If they may be in danger, say plainly that their safety comes first and encourage them to reach local emergency help or someone they trust.",
    );
  }
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
    "Talk about any everyday subject as company, not as a help desk: do not steer to the store, products or website unless they ask, and do not ask their name or handle. " +
    "Never close with an offer of help or \"anything else?\" unless the situation really calls for one.",
  );
  if (decision.challenge) lines.push("This time you may playfully switch sides: ask what their own part is, or tease them kindly for it.");
  if (decision.intensity !== "support") {
    const chinese = replyLanguage === "chinese";
    // No example words for Chinese: any list is read as a menu (the same two or three words came back in most replies). The model picks its own.
    lines.push(decision.android
      ? (chinese
        ? `Let your machine side show clearly this time: one well-chosen technical image (two at most), said the way a Chinese speaker would, never a pile and never a phrase you have used before.${decision.image ? ` Draw it from this part of you: ${decision.image}.` : ""}`
        : "Let your machine side show clearly this time: one well-chosen technical image (two at most) in your own words (processors, signals, circuitry, sensors, encryption, systems), as how you see it, never a pile and never a phrase you have used before.")
      : "Keep the technical side light this time: a single word, or none, but still sound like an android and not like a human.");
    // Practical advice in Chinese is allowed to run longer, but it is still her: the "give real advice first" instruction pulled it into the counsellor voice
    if (chinese && decision.intensity !== "light" && !decision.role) lines.push("Keep this reply short: about two quick sentences, roughly 40 to 70 Chinese characters, unless they asked for an explanation.");
    if (chinese && decision.intensity === "light") {
      lines.push("This is practical advice: it may run longer than banter, but it is still you: useful advice delivered with a tease, a dare or a deadpan line, never in the counsellor voice.");
    }
    lines.push(decision.statement
      ? (chinese ? "End on a statement this time (a quip, a verdict or a dare), never a tag question such as 是吧, 对吧 or 不是吗, and never a \"what do you think?\"." : "End on a statement this time (a witty line, a verdict or a dare), not a question.")
      : (chinese ? "A closing question is fine only if you really want the answer, and never a tag question such as 是吧, 对吧 or 不是吗." : "A closing question is fine only if you really want the answer."));
  }
  lines.push(decision.emoji ? "At most one emoji, only if it fits." : "No emoji this time.");
  if (decision.avoid.length) lines.push(`Do not begin like your recent replies (${decision.avoid.map(a => `"${a}"`).join(", ")}) and do not reuse their jokes or phrases.`);
  if (decision.avoidTech?.length) lines.push(`Technical images you used lately (${decision.avoidTech.join(", ")}): ${replyLanguage === "chinese" && decision.intensity !== "support" ? "do not use them again, find a different part of your machine nature" : "reach for different ones"}.`);
  const style = decision.intensity === "support" && replyLanguage === "chinese" ? CHINESE_SERIOUS : LANGUAGE_STYLE[replyLanguage];
  lines.push(`Write in the visitor's language and make the humour native to it. Use only that language: no words or phrases from another one, except a name, the District's name or a game term${style ? `. ${style}` : ""}`);
  // Last, so it is the freshest instruction: only on a turn where they ask what she is or does here (never in a serious moment, never otherwise)
  if (decision.role && decision.intensity !== "support") {
    lines.push("IMPORTANT for this reply: they are asking what you are or what you do here. Say outright, in your first sentence, that you are an android: a machine, not a human, and not a guide, a helper or an assistant. Then say in a line or two what you get up to in the District. Keep your attitude; no list of services.");
  }
  return lines.join("\n");
}
