/* District text chat rules. PURE: text in, a cleaned message or a refusal out. The hub (protocol.cjs) owns who may speak and who hears it; this file only decides
   whether a line is acceptable. Chat is room-wide in the District interior, short, plain text, never links, never markup (clients draw it with textContent). */
'use strict';
const RULES={maxChars:200,minIntervalMs:700,windowMs:10000,perWindow:5,duplicateMs:15000,lockAfterRefusals:5,lockMs:60000,historyKeep:40,reasons:['harassment','spam','inappropriate','cheating','other'],maxIgnored:100,reportEveryMs:20000,reportsPerSession:5,noteChars:120};
// invisible and direction-changing characters are removed, not trusted: zero-width, bidi overrides, byte-order mark, soft hyphen, tag characters
const HIDDEN=/[­͏؜ᅟᅠ឴឵᠋-᠎​-‏‪-‮⁠-⁯ㅤ︀-️﻿ﾠ\u{e0000}-\u{e0fff}]/gu;
const CONTROL=/[\p{Cc}\p{Cs}\p{Co}\p{Cn}]/gu;
const LINK=/(?:https?:\/\/|www\.|ftp:\/\/|\b[a-z0-9-]{2,}\.(?:com|net|org|io|gg|ly|me|tv|xyz|ru|cn|info|biz|co|app|dev|link|click|top)\b)/i;
/* -> {ok:true,text} or {ok:false,reason} */
function clean(raw){
  if(typeof raw!=='string')return {ok:false,reason:'Say something first.'};
  let t=raw.normalize('NFKC').replace(HIDDEN,'').replace(/[\s\u0085\u2028\u2029]+/g,' ').replace(CONTROL,'').trim();
  if(!t)return {ok:false,reason:'Say something first.'};
  if([...t].length>RULES.maxChars)return {ok:false,reason:'That message is too long (200 characters at most).'};
  if(LINK.test(t))return {ok:false,reason:'Links are not allowed in chat.'};
  if(/(.)\1{11,}/u.test(t))return {ok:false,reason:'Please do not spam repeated characters.'};
  return {ok:true,text:t};
}
// A short note attached to a report: plain text only.
function cleanNote(raw){if(typeof raw!=='string')return '';return raw.normalize('NFKC').replace(HIDDEN,'').replace(CONTROL,' ').replace(/\s+/g,' ').trim().slice(0,RULES.noteChars);}
module.exports={RULES,clean,cleanNote};
