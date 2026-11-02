# Iris on a real Android phone: checklist

**Status of testing.** Automated emulation has run (`node tests/iris-mobile-emulation-browser.cjs`, Playwright's Pixel 7 profile, the Iris service replaced by stand-in answers): 14/14 checks passed on 2026-11-01. **That is a simulation. No physical phone has been tested.** The live-data replies (weather, earthquakes, news, time) have also not been read on a phone against the real service. Tick the boxes below on your phone and note anything odd; a box with no tick means "not tested".

Use Chrome on the phone, on https://thedarknetdistrict.com. Do it once on Wi-Fi and once on mobile data.

## 1. Open, close, minimize
- [ ] Tap **Chat with Iris**: the window opens, the title bar is visible and not under the navigation, nothing is cut off at the edges.
- [ ] The welcome line appears within a second or two.
- [ ] Tap **–** (minimize): the window closes and the Chat with Iris button is still there. Tap it: the same conversation is back.
- [ ] Open, close and open again five times quickly: nothing duplicates or freezes.

## 2. Keyboard and layout
- [ ] Tap the message box: the keyboard opens, the title bar and the message box both stay on screen, the box is not hidden behind the keyboard.
- [ ] Type a long message (several lines): the box stays usable. Tap Send: the keyboard may close; the latest messages are visible.
- [ ] The page does not zoom in when you tap the box.
- [ ] Credit line under the message box ("Weather: MET Norway … Places: © OpenStreetMap contributors") is readable, not covering anything. The three links open in a new tab.

## 3. Orientation and size
- [ ] Rotate to landscape with the chat open: the window still fits and you can still type and send.
- [ ] Rotate back to portrait: layout recovers, no sideways scroll.
- [ ] Pinch-zoom the page and back: the chat window does not end up off screen.
- [ ] Split-screen or a floating window (if your phone has it): still usable.

## 4. Conversation persistence
- [ ] Send two messages, then reload the page: the window starts closed and the on-screen conversation starts again (the website does not store the chat on the phone). Ask "what did I just say?": she should remember from the server's memory if you are recognised, or answer honestly if not.
- [ ] Switch to another app for a minute and back: the chat is as you left it, or reloads cleanly.
- [ ] Signed in vs signed out (if you use an account): the behaviour matches what you expect; nothing from another visitor ever appears.

## 5. Languages
Type each, check the reply is in the same language and the characters display (no empty boxes):
- [ ] English
- [ ] 简体中文: 今天天气怎么样？
- [ ] 繁體中文: 今天天氣如何？
- [ ] 日本語: 今日の天気は？
- [ ] Español: ¿Qué tiempo hace en Sacramento?
- [ ] Русский: Какая сейчас погода в Сакраменто?
- [ ] Voice typing or an emoji in a message works.

## 6. Live data (real service)
For each, check the numbers look plausible against another app, and that any joke is clearly a joke:
- [ ] Weather: "What's the weather in Sacramento right now?" then "and tomorrow?" (follow-up uses the earlier place).
- [ ] An ambiguous place: "What's the weather in Portland?" (she should ask which one, or say which she picked).
- [ ] An unknown place: "What's the weather in Atlantis?" (she should say she cannot find it, not make up weather).
- [ ] Earthquakes: "Any earthquakes today?" (real USGS places and magnitudes; a big one should get a calm, serious reply with no jokes).
- [ ] News: "What's the latest tech news?" (headlines name their outlet).
- [ ] Time: "What time is it in Tokyo, and what's the date there?" (matches your phone's world clock).
- [ ] Air quality: ask "how bad is the air in Beijing?" She has no air-quality data. She may joke about smog, but must not quote an AQI or say she measured anything.
- [ ] She does not bring up the weather, news or earthquakes unless you ask.

## 7. Bad network
- [ ] Switch on airplane mode, send a message: within about 10 seconds she says the link is disrupted ("Neural interface disrupted…"). No endless spinner.
- [ ] Turn the network back on and send again: it works without reloading.
- [ ] After the service has been idle a while (not used for 15+ minutes), the first message may be slow: you should see "Uplink is waking up…" at about 8 seconds, then the reply.
- [ ] Walk into a weak-signal spot (lift, basement), send a message: you get a reply or the disrupted message, never a frozen window.

## 8. Loading and errors
- [ ] Something visibly shows that she is answering (typing effect or indicator).
- [ ] Send many messages quickly (about 20 in a minute): she answers in character that you are going too fast; the window keeps working.
- [ ] A very long message (over 1000 characters) gets an in-character refusal, not an error page.

Report anything that fails with the phone model, Android and Chrome version, orientation, and what you saw.
