// The language rules on their own (no server): what counts as an explicit request, and how the conversation's default moves.
import test from "node:test";
import assert from "node:assert/strict";
import { decideLanguage, explicitLanguageRequest, isClearEnglish, normalizeLanguage, preferredFromStored } from "../server/language";

test("a detector's labels are mapped to one name", () => {
  for (const label of ["Mandarin", "simplified chinese", "Chinese (Simplified)", "zh", "Cantonese"]) assert.equal(normalizeLanguage(label), "chinese", label);
  assert.equal(normalizeLanguage("Spanish."), "spanish");
  assert.equal(normalizeLanguage(""), "english");
  assert.equal(normalizeLanguage(undefined), "english");
});

test("explicit requests are recognized in English and Chinese, and ordinary messages are not mistaken for them", () => {
  assert.deepEqual(explicitLanguageRequest("Please translate that into Chinese"), { kind: "translate", language: "chinese" });
  assert.equal(explicitLanguageRequest("how do you say good morning")?.kind, "translate");
  assert.equal(explicitLanguageRequest("这个翻译成英文")?.kind, "translate");
  assert.equal(explicitLanguageRequest("Can you answer in both Chinese and English?")?.kind, "bilingual");
  assert.equal(explicitLanguageRequest("请用双语回答")?.kind, "bilingual");
  assert.deepEqual(explicitLanguageRequest("Reply in English from now on please"), { kind: "switch", language: "english" });
  assert.deepEqual(explicitLanguageRequest("can we switch to Spanish"), { kind: "switch", language: "spanish" });
  assert.deepEqual(explicitLanguageRequest("do you speak French"), { kind: "switch", language: "french" });
  assert.deepEqual(explicitLanguageRequest("用英文回答我"), { kind: "switch", language: "english" });
  assert.deepEqual(explicitLanguageRequest("请说中文"), { kind: "switch", language: "chinese" });
  for (const plain of ["你好", "ok", "I love the English countryside", "what is the district", "thanks"]) {
    assert.equal(explicitLanguageRequest(plain), null, plain);
  }
});

test("the default language moves for clear messages and holds for short or ambiguous ones", () => {
  const step = (detected: string, text: string, preferred: string) => decideLanguage({ detected, text, preferred });
  assert.deepEqual(step("chinese", "你好，你是谁？", "english"), { reply: "chinese", preferred: "chinese" });
  assert.equal(step("english", "ok", "chinese").reply, "chinese");
  assert.equal(step("english", "thanks!", "chinese").reply, "chinese");
  assert.equal(step("english", "Please tell me about the district", "chinese").reply, "english");
  assert.equal(step("spanish", "hola amigo, como estas hoy", "chinese").reply, "spanish");
  assert.equal(step("english", "ok", "english").reply, "english");
  // explicit requests
  assert.deepEqual(step("english", "Reply in English from now on please", "chinese"), { reply: "english", preferred: "english", explicit: { kind: "switch", language: "english" } });
  const translate = step("english", "Please translate that into English", "chinese");
  assert.equal(translate.reply, "chinese");
  assert.equal(translate.preferred, "chinese", "a translation is one reply; the default stays");
  assert.equal(step("english", "answer in both Chinese and English", "chinese").explicit?.kind, "bilingual");
});

test("clear English means a real sentence with no other script", () => {
  assert.equal(isClearEnglish("ok"), false);
  assert.equal(isClearEnglish("thank you"), false);
  assert.equal(isClearEnglish("Please tell me about the district"), true);
  assert.equal(isClearEnglish("tell me about 你好 please"), false);
});

test("a chat's default is rebuilt from the stored messages after a restart", () => {
  const zh = (text: string) => ({ text, language: "chinese" });
  const en = (text: string) => ({ text, language: "english" });
  assert.equal(preferredFromStored([]), "english");
  assert.equal(preferredFromStored([zh("你好，你是谁？"), en("ok"), en("thanks")]), "chinese");
  assert.equal(preferredFromStored([zh("你好"), en("Please tell me about the district today")]), "english");
  assert.equal(preferredFromStored([zh("你好"), en("Reply in English from now on please"), en("ok")]), "english");
  assert.equal(preferredFromStored([en("hello there my friend"), { text: "hola amigo, como estas hoy", language: "spanish" }]), "spanish");
  assert.equal(preferredFromStored([{ text: "x", language: null }]), "english");
});
