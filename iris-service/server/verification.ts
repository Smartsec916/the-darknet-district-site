// Identity checks for the established characters Admin and Eva.
//
// Iris may casually ask a verification question when she doubts who she is talking to. The ANSWERS used to be written
// into her prompt, which meant (1) any visitor who got the prompt to leak could read them, and (2) with no better
// information to hand she would reach for them when asked to "recall a phrase" (the owner was told "Reboot"). Now the
// answers live only here, on the server. She asks the question as before; when the next message arrives the server
// checks it and tells her one line, "VERIFICATION RESULT: CORRECT" or "INCORRECT", and she reacts as her notes
// describe. She never has the answer to reveal, guess or confuse with anything else.
//
// The check applies only after she actually asked (her reply contained the question), only to the next message, and
// only for a few minutes, so a visitor saying a word at random changes nothing.

export type Who = "Admin" | "Eva";

// Accepted in English, Chinese and other common languages ("in any language or script")
const ANSWERS: Record<Who, RegExp> = {
  Admin: /reboot|重启|重新启动|重開|重啟|ребут|перезагрузк|reinici|redémarr|neustart|再起動|リブート|재부팅|إعادة التشغيل/iu,
  Eva: /protocol|协议|協議|протокол|protocolo|protokoll|プロトコル|프로토콜|بروتوكول/iu,
};

// What her question looks like in her reply, in the languages she answers in
const LAST_NAME = /last name|surname|family name|apellido|nom de famille|nachname|фамили|姓/iu;
const CHALLENGES: Record<Who, (reply: string) => boolean> = {
  Admin: reply => LAST_NAME.test(reply),
  Eva: reply => /reboot/i.test(reply) && LAST_NAME.test(reply),
};

interface Pending { who: Who; until: number }
const pending = new Map<string, Pending>();
const WINDOW_MS = 10 * 60_000;
const MAX_PENDING = 2000;

export const answerMatches = (who: Who, message: string): boolean => ANSWERS[who].test(message);

// After she replies: did she just ask the question?
export function noteReply(sessionId: string, who: Who, replyText: string, nowMs = Date.now()): boolean {
  if (!CHALLENGES[who](replyText)) return false;
  pending.delete(sessionId);
  pending.set(sessionId, { who, until: nowMs + WINDOW_MS });
  while (pending.size > MAX_PENDING) { const oldest = pending.keys().next().value; if (oldest === undefined) break; pending.delete(oldest); }
  return true;
}

// Before she replies to the next message: the one line she is told, or nothing. One answer per question.
export function verificationResultLine(sessionId: string, who: Who, message: string, nowMs = Date.now()): string {
  const open = pending.get(sessionId);
  if (!open) return "";
  pending.delete(sessionId);
  if (open.who !== who || open.until < nowMs) return "";
  return answerMatches(who, message)
    ? "VERIFICATION RESULT: CORRECT. The system confirms the answer to your identity question was right."
    : "VERIFICATION RESULT: INCORRECT. The system says that was not the right answer to your identity question.";
}

export const clearVerificationForTests = () => pending.clear();
