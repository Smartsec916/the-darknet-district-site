# The Iris ChatDot (embeddable widget)

The round "dot" chat is `client/public/embedded.html`, served by the Iris service at
`https://darknet-district-iris.onrender.com/embed`. It uses the same service and the same
`/api/chat/message` request as the homepage chat, so conversations from both are stored in the
same `chat_messages` table and show up together in the viewer and the daily report.

## How to put it on a page

Use an iframe (the page runs its own script, which `innerHTML` injection cannot run):

```html
<iframe src="https://darknet-district-iris.onrender.com/embed" title="Iris"
        style="position:fixed;right:0;bottom:0;width:440px;height:700px;border:0;background:transparent"
        allow="clipboard-write"></iframe>
```

`/embed` can be framed only by the sites in `ALLOWED_ORIGINS` (set on Render, comma-separated;
default `https://thedarknetdistrict.com,https://www.thedarknetdistrict.com`). If a host page has a
Content-Security-Policy with `frame-src`, add `https://darknet-district-iris.onrender.com` to it.
The widget needs no CORS entry of its own: when it runs inside `/embed` its requests go to its own
origin.

The page's own policy lets it run only its inline script and style, show its built-in portrait, and
connect to this service.

## What the widget does on each message

- opens: pings `/api/health` (wakes Render's free tier) and creates a session with `/api/chat/session`
- every message: `POST /api/chat/message` with `{sessionId, message, messageCount, timestamp}`;
  `messageCount` goes up by one per message
- a dropped connection or 502/503/504 is retried once with the **same** `messageCount`, and the
  service answers and stores a repeated request once
- after 8 seconds without a reply it adds "Uplink is waking up. Give me a moment..."; it waits up to
  2 minutes and does not retry a timeout
- if the session cannot be created it uses a local session id, so a message is never dropped

The Iris service must be the version with conversation history for the counter to prevent duplicates;
an older deployment ignores `messageCount` and works otherwise.
