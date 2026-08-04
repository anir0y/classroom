---
title: TryHackMe Overheard at Breakfast — An Email Is an Identity
date: 2026-08-04T22:15:00+05:30
lastmod: 2026-08-04T22:15:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-overheard/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - OSINT
  - Gravatar
  - Email Hashing
  - Privacy

draft: false
description: "Walkthrough of the TryHackMe room Overheard at Breakfast — turning an email dropped in casual chat into a forgotten Gravatar profile, and the flag in its bio."
---

## Overheard at Breakfast

**Day 6 of Hacker Holidays 2026.** After yesterday's boot2root at the Beach Bar, the Byte Lotus goes quiet again. No lab machine, no ports, no shell — this one is pure OSINT. All you get is a screenshot of a chat.

The setup: **Ponzi**, a resort influencer, is making small talk with **Lambo**, the guest whose data we've been tripping over all event. Ponzi wants Lambo's social handle so he can tag him in posts. Lambo says he's mostly off social media these days, and offers his email instead.

That's the whole room. One person being politely unhelpful, and leaking more than the handle he refused to give.

## Step 1: Read the conversation like a target profile

The task file is a `conversation.png` — a chat log between the two. I'm not going to reproduce TryHackMe's artwork here, but three things in Lambo's replies matter, and it's worth being precise about which and why.

![Analysis panel listing the three clues: the platform hint about a free tool starting with G resolving to Gravatar, the email address lambobytelotushotel at gmail dot com, and the false comfort of having wiped everything](/img/thm-overheard/01-clues.png)

**The platform.** Lambo describes it rather than naming it:

> "this free tool that let me upload my profile and link other media accounts was neat, until I wiped everything. Started with a `G` if I remember correctly."

A free service where you upload a profile and link your other accounts, starting with G. Not GitHub — you don't "upload a profile" there in that sense. The phrasing that gives it away is **"link other media accounts"**, which is exactly what a Gravatar profile does: one profile, a stack of linked accounts, attached to an email address. **Gravatar.**

**The identifier.** Immediately after, he hands over the thing that makes it findable:

> "But if anything this is my best way of communication: `lambobytelotushotel@gmail.com`"

**The false comfort.** *"until I wiped everything."* Lambo believes he cleaned up. Hold that thought — it's the actual lesson of the room.

Note the shape of what just happened. Ponzi asked for a *handle* and Lambo declined, because a handle felt like exposure. Then he volunteered an *email*, because an email felt like a private channel. In OSINT terms he traded a low-value identifier for a high-value one. An email address is not a contact method; it's a **primary key** that a lot of services will happily look up for you.

## Step 2: Why an email address is a lookup key

Gravatar ("Globally Recognised Avatar") is the service behind the profile pictures on countless WordPress blogs, commit logs and comment sections. The design is simple and, for our purposes, extremely useful:

**Gravatar identifies you by a hash of your email address, and serves your profile to anyone who can compute that hash.** No account, no API key, no authentication.

```bash
EMAIL=lambobytelotushotel@gmail.com
printf '%s' "$EMAIL" | md5
# d4a5fc5d3128890778667e24617d7cc0
printf '%s' "$EMAIL" | shasum -a 256
# d43faafe9d7f056793bd037b8d6e321acad985c222d83775b10d6539e301e931
```

Historically the hash was **MD5** of the lowercased, trimmed address. Gravatar now prefers **SHA-256**, but keeps MD5 working for compatibility. I checked both against this profile and **both resolve** — worth knowing, because plenty of tutorials only mention one and you might otherwise think you'd got the address wrong.

Before pulling the profile, confirm one exists. The avatar endpoint takes a `d=` (default) parameter for what to serve when there's no match, and `d=404` turns it into a clean existence oracle:

![Terminal showing MD5 and SHA-256 of the email, the avatar endpoint returning 200 for the real address, and 404 for a control address with no Gravatar](/img/thm-overheard/02-hash-probe.png)

```bash
curl -s -o /dev/null -w '%{http_code}' "https://gravatar.com/avatar/$MD5?d=404"
# 200   <- a profile exists
```

**Always test your method against a known negative.** I'd started this room with a wrong email address taken from someone else's summary, got a `404`, and couldn't immediately tell whether the address was wrong or my hashing was. Running the same probe against an address I *knew* had a Gravatar returned `200`, which proved the pipeline worked and the address was simply wrong. Ten seconds of control testing saved a chunk of debugging.

{{< ad >}}

## Step 3: The profile Lambo thought he deleted

Gravatar exposes public profiles as JSON at `https://gravatar.com/<hash>.json`:

```bash
curl -s "https://gravatar.com/d4a5fc5d3128890778667e24617d7cc0.json" | jq '.entry[0]'
```

![Gravatar profile JSON showing profileUrl, displayName Lambo, pronunciation, currentLocation Byte Lotus Hotel, and an aboutMe field ending in a long base64 string](/img/thm-overheard/03-profile-json.png)

```json
{
  "profileUrl": "https://gravatar.com/cheerfullysongf28e3c3716",
  "displayName": "Lambo",
  "pronunciation": "Lam-boh",
  "currentLocation": "Byte Lotus Hotel",
  "aboutMe": "Funny thing about email hashes, they follow you places you
   didn't expect. Glad you found the right corner of the internet!
   Here is your prize: VEhNe1MzY3JlVF9QcjBmaWwzX0g0c19iMzNuX0lkZW50MWZpM2R9"
}
```

There it is. He wiped his social media and never touched this, which is exactly what "I wiped everything" means in practice for most people: they clean up the accounts they *think of*, and Gravatar is not an account anyone thinks of. You make one once, years ago, while signing up for something else entirely, and it quietly outlives every platform you deliberately quit.

Note how much this hands over even before the flag. A **display name**, a **phonetic pronunciation**, a **current location** (`Byte Lotus Hotel`, confirming he's on-site), and a **vanity URL** — `cheerfullysongf28e3c3716` — that works on its own and is now a fresh identifier to pivot on. On a real target this profile would typically also carry the *linked accounts* section, which is the whole point of the service and the single richest pivot in it.

## Step 4: Decode

The `aboutMe` string is `VEhN...` — and `VEhN` is what `THM` looks like after Base64 encoding, so this is barely even a guess:

```bash
echo VEhNe1MzY3JlVF9QcjBmaWwzX0g0c19iMzNuX0lkZW50MWZpM2R9 | base64 -d
```

![Terminal decoding the base64 string into the flag THM S3creT Pr0fil3 H4s b33n Ident1fi3d](/img/thm-overheard/04-flag.png)

> `THM{S3creT_Pr0fil3_H4s_b33n_Ident1fi3d}`

CyberChef's *From Base64* does the same thing if you'd rather not leave the browser. Recognising encodings on sight is a cheap skill worth building: `VEhN` → `THM`, `SFRC` → `HTB`, `eyJ` → a JSON object (so, usually a JWT), `H4sI` → gzip.

## What this room is actually teaching

It's a five-minute challenge, and the temptation is to file it as "look up a Gravatar." The mechanism underneath is worth more than that.

**Hashing an email is not anonymising it.** This is the important one. Gravatar hashes addresses, which *sounds* privacy-preserving — the URL contains no plaintext email. But hashing only protects secrets with enough entropy to resist guessing, and email addresses have almost none. There are a few billion of them, they follow predictable patterns, and MD5 is fast. Anyone can hash a list of candidate addresses and check them all. The hash isn't a lock; it's a **lookup key that happens to look scary**.

That generalises well beyond Gravatar. Any time you see a system "anonymise" identifiers by hashing them — email addresses, phone numbers, national IDs, MAC addresses — the same reasoning applies. If the input space is small enough to enumerate, the hash is reversible in practice regardless of how strong the algorithm is. It's the same reason unsalted password hashes of common passwords fall instantly.

**It's a silent confirmation oracle.** Independent of the flag, `?d=404` tells you whether an address is real and in use, without sending mail and without the target ever knowing. No login, no rate-limit friction, no trace on their side. For a phisher deciding which addresses in a list are worth targeting, that's genuinely valuable — and it's a normal, documented feature of the service.

**Deleting the account you remember isn't deleting your footprint.** Lambo did the thing security advice tells people to do — he got off social media. His exposure didn't come from the platforms he quit. It came from a profile attached to an *email*, not to a *platform*, which is precisely the category people never audit.

**Refusing the obvious identifier doesn't help if you hand over a better one.** He wouldn't give a handle but gave an email. In the end the email led to a profile, which produced a display name, a location, and a vanity URL — more than the handle would have.

## Protecting yourself

Concrete and worth doing, in about two minutes:

**Check whether you have a Gravatar you forgot about.** Hash your own addresses — including old ones and work ones — and hit the avatar endpoint with `?d=404`. A `200` means there's a public profile out there tied to that address.

```bash
printf '%s' "you@example.com" | shasum -a 256
curl -s -o /dev/null -w '%{http_code}\n' "https://gravatar.com/avatar/<hash>?d=404"
```

**If you find one, actually delete it** at [gravatar.com](https://gravatar.com) rather than just blanking the fields — and remember that removing the *image* leaves the *profile* behind, which is the mistake Lambo made. While you're there, check the linked-accounts section, because that's the part that turns one profile into a map of your whole online presence.

**Use a different address for public-facing signups** than the one you hand to strangers. Plus-addressing (`you+forum@gmail.com`) doesn't help here — it's a different string, so it hashes differently, but it also visibly contains your real address. Separate addresses or an alias service is the real fix.

**Assume any email you give out is a lookup key**, not just a mailbox. Gravatar is one service that does this openly; breach-aggregation and people-search sites do the same thing less politely.

## Room summary

| | |
|---|---|
| Room | Overheard at Breakfast |
| Event | Hacker Holidays 2026 — Day 6 |
| Category | OSINT |
| Artefact | `conversation.png` — chat between Ponzi and Lambo |
| Pivot | `lambobytelotushotel@gmail.com` |
| Service | Gravatar (profile keyed by MD5 **or** SHA-256 of the email) |
| MD5 | `d4a5fc5d3128890778667e24617d7cc0` |
| Profile | `https://gravatar.com/cheerfullysongf28e3c3716` |
| Flag location | `aboutMe` field, Base64-encoded |
| Flag | `THM{S3creT_Pr0fil3_H4s_b33n_Ident1fi3d}` |

## Wrap-up

The whole room, three commands:

```bash
printf '%s' lambobytelotushotel@gmail.com | md5             # d4a5fc5d31288907...
curl -s https://gravatar.com/d4a5fc5d3128890778667e24617d7cc0.json | jq -r '.entry[0].aboutMe'
echo VEhNe1MzY3Jl...MWZpM2R9 | base64 -d                    # flag
```

What I like about this one is that there's no vulnerability in it. Nothing was hacked, nothing was misconfigured, and Gravatar behaved exactly as designed and documented. The entire chain is **public data, working as intended**, assembled by someone who knew that an email address is a join key.

That's most real OSINT. Not a leak, but a person being ordinarily helpful, plus a service being ordinarily open, plus somebody bothering to connect the two.

And Lambo's mistake is the most human one on the board this week. He did clean up. He just cleaned up the things he could remember. 🪷
