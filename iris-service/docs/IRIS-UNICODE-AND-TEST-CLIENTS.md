# Japanese (and other non-ASCII) text, and test clients on Windows

## What happened (2026-11-02)

The administrator viewer showed a Japanese visitor message as `??????????` while Iris answered in Japanese ("北京の時間ですね…"). It was investigated end to end. **Nothing in Iris, the database or the viewer changes characters.** The server received ten literal question marks.

Evidence:

- The stored row is **10 characters and 10 bytes** (ASCII `?`, 0x3F). Real Japanese would be 3 bytes per character. It is the only all-question-mark row among 44 visitor messages. The database also holds 1 visitor message with kana and 17 with Chinese characters, stored as real characters (counted by character class; their text was not read). The database is UTF8 (`server_encoding`, `client_encoding`, database encoding).
- The session had one earlier visitor message, 27 characters long and starting with "W" (its text was not read; it was probably an English question about Beijing's time). The stored language of the question-mark message is "japanese". The most likely explanation is that the model answered the question marks from the earlier turn and the detected language, but this is inferred, not observed. Either way, a Japanese-looking reply does **not** prove the server received Japanese.
- Windows PowerShell 5.1 reproduces it exactly. `Invoke-RestMethod` and `Invoke-WebRequest` with a **string** body and `Content-Type: application/json` (no charset) put literal `?` bytes on the wire for any character outside Latin-1. Measured at the receiving end:

| Client | Bytes the server received |
|---|---|
| PS 5.1, string body, `application/json` | `3f 3f 3f 3f …` (question marks) |
| PS 5.1, `Invoke-WebRequest`, string body | `3f 3f 3f 3f …` |
| PS 5.1, string body, `application/json; charset=utf-8` | correct UTF-8 |
| PS 5.1, body as `[Text.Encoding]::UTF8.GetBytes($json)` | correct UTF-8 |
| `curl.exe --data-binary @body.json` (UTF-8 file) | correct UTF-8 |
| a browser (`fetch` with `JSON.stringify`) | correct UTF-8 |

- A second trap: a `.ps1` file saved as UTF-8 **without a BOM** is read by Windows PowerShell 5.1 as ANSI, so a Japanese literal inside it becomes mojibake (and can break parsing). Save the script as UTF-8 **with BOM**, or build the text from code points, or use PowerShell 7.
- Pasting Japanese into a command run through some terminals or tool wrappers can also lose it before the program starts. Put the text in a UTF-8 file and read the file.

## Does it affect real visitors?

No evidence of it. The browser sends UTF-8 (verified in a real browser against a local copy: typed Japanese with kana, kanji and an emoji reached the stored row, the administrator API and the viewer page unchanged). The one corrupted row came from a test client.

## Sending a test message safely from Windows PowerShell

```powershell
# Save this file as UTF-8 WITH BOM (or build $text from code points). Replace the URL; do not point tests at production visitors' sessions.
$text = 'こんにちは、北京は今何時ですか？'
$json = @{ sessionId = 'my-test-session'; message = $text } | ConvertTo-Json -Compress
Invoke-RestMethod -Method Post -Uri 'https://YOUR-TEST-HOST/api/chat/message' `
  -ContentType 'application/json; charset=utf-8' `
  -Body ([Text.Encoding]::UTF8.GetBytes($json))
```

To check what actually left the machine, send to a local listener first and look at the bytes (`e3 81 …` for Japanese, not `3f`).

## Regression test

`tests/unicode-roundtrip.test.ts` sends Japanese (hiragana, katakana, kanji), Simplified and Traditional Chinese, Korean, Russian, accented Spanish, English, and mixed text with punctuation and emoji through the real chat route, with and without a charset in the request, then compares the stored row and the administrator API response code point by code point. It also checks the viewer page declares UTF-8, that English, Chinese and Japanese time questions are still answered correctly, and records that a message which arrives as `??????????` is stored as received (the server cannot restore what the client already lost).
