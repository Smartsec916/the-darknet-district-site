# Rate limits and who counts as "the visitor"

Iris spends OpenAI credits, so every chat request passes these limits:

| Limit | Default | Scope | Setting |
|---|---|---|---|
| Messages per minute | 20 | per visitor | fixed |
| Messages per day | 150 | per visitor | `CHAT_LIMIT_PER_DAY` |
| Messages per day | 3000 | everyone together | `CHAT_GLOBAL_DAILY_LIMIT` |
| API requests per minute | 60 | per visitor | fixed |
| Failed admin/report logins | 10 per 15 minutes | per visitor | fixed |

Also: a 1,000-character message limit, a 16 KB request limit, a 20 s OpenAI timeout, and your
monthly spending cap in the OpenAI dashboard, which is the final backstop. Counts are kept in
memory, per running copy of the service, and start again from zero after a restart.

## Finding the visitor behind Render and Cloudflare

A request reaches the service as `visitor -> Cloudflare -> Render's proxy -> Iris`, and each hop
appends to the `X-Forwarded-For` header. "Per visitor" limits need the real visitor's address:

- **Trusting one hop (the old setting)** made the Cloudflare edge address the "visitor". It changes
  from request to request, so one person got many buckets and unrelated people shared one.
- **Trusting too much, or the left side of the header,** lets anyone type an address into
  `X-Forwarded-For` and get a fresh bucket every time. Render appends to the header without
  clearing what the client sent.

So the service trusts **no count**. Express reads the header from the right and stops at the first
address that is not a trusted proxy; that address is the visitor. The trusted proxies are:

1. the connection straight to the app (Render's proxy), always;
2. Cloudflare's published edge ranges (`server/clientIp.ts`, from cloudflare.com/ips);
3. private addresses (Render's internal hops).

A visitor's real address stops the walk before it reaches anything they forged, and the chain
length does not matter. IPv4 addresses written as `::ffff:a.b.c.d` are treated as plain IPv4 so
one visitor is never two buckets.

If Cloudflare adds a range the service does not know, the new edge address is treated as the
visitor. That fails safe: limits merge, they never open up. Add the range without a code change:

```
TRUSTED_PROXY_RANGES=203.0.113.0/24,2001:db8::/32      (comma-separated CIDRs, optional)
```

## Fallback: a fixed hop count

If verification below ever fails on Render, set `TRUSTED_PROXY_HOPS=2` (a whole number 0 to 5) and
restart. It makes Express trust exactly that many hops instead of ranges. Use it only as a stopgap:
too high a number is spoofable, too low merges visitors, so run the verification again after any
change. Invalid values are ignored with a `trusted_proxy_hops_ignored` log line.

## Verify it, from the outside and read-only

```bash
node scripts/verify-client-ip.mjs https://darknet-district-iris.onrender.com
```

It sends nine `GET` requests to a path that does not exist (no chat, no OpenAI, no database), some
plain and some with forged `X-Forwarded-For` values, and reads the `RateLimit-Remaining` header.
For one visitor it must count down by exactly one each time:

| Result | Meaning |
|---|---|
| **PASS** | steady countdown: one bucket for you, and forged headers did not change it |
| **WARN** | drops by more than one: other visitors are counted in your bucket (usually just other traffic) |
| **FAIL** | the counter went back up: the service sees different "visitors" for you, or a forged header gave you a fresh bucket |

A one-minute window can roll over mid-test, so it retries up to three times before reporting FAIL.
A genuine problem fails every time.

The logs also help. `client_ip_configured` shows the mode at start. `client_ip_diagnostic`
(at most every 6 hours, never an address) shows `forwardedEntries`, whether Cloudflare's own
header is present, and `resolvedIsProxy`. If `resolvedIsProxy` is `true`, visitors are resolving
to a proxy and are sharing one limit: fix the ranges or hops.

## What is tested

`tests/client-ip.test.ts` (address resolution for every chain shape, forged headers of every
kind, IPv6, the fallback settings) and `tests/client-ip-server.test.mjs` (the real server and its
real limiters: separate visitors, the same visitor through different edges, forged headers cannot
reset a bucket or spend someone else's, the per-minute limit, and that the global daily limit is
still global).

## Known limits

- IPv6: each address is its own bucket. A visitor with a whole IPv6 block can rotate within it;
  the global limit and your OpenAI cap still bound the cost.
- Several people behind one office or school connection share one visitor address by nature.
- A restart clears all counts.
