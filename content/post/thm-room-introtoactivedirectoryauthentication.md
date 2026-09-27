---
title: "TryHackMe Intro to AD Authentication: NetNTLM to Golden Ticket"
date: 2026-09-27T22:15:00+05:30
lastmod: 2026-09-27T22:15:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-adauth/00-thumbnail.png

categories:
  - TryHackMe

tags:
  - tryhackme
  - thm
  - rooms
  - Active Directory
  - AD Security Testing Basics
  - Jr Penetration Tester
  - NetNTLM
  - Kerberos
  - Pass-the-Hash
  - Kerberoasting
  - Golden Ticket
  - impacket
  - hashcat
  - NTLM

draft: false
description: "TryHackMe Intro to AD Authentication walkthrough: NetNTLM challenge response, Kerberos tickets, NTLM cracking, Pass-the-Hash, Kerberoasting and a Golden Ticket."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|Intro to AD Authentication |![Intro to AD Authentication room icon](https://cdn-images.tryhackme.com/room-icons/6808d44047ac5684351c94da-1777562424344)|

**Intro to AD Authentication** follows [Active Directory Basics](/post/thm-room-winadbasicsrevamp/) in the AD Security Testing Basics module. Where that room had you build a forest, this one explains how the forest decides who you are, and then hands you six SMB shares that each require a different way of proving it. You collect one flag per share, and the share you can reach is a direct function of the authentication material you hold: a password, a ticket, a hash, or a forged ticket.

That structure is the good part of the room. Nothing is hidden. The task text gives you the credentials and the commands, so the difficulty is not discovery, it is understanding why `smbclient.py` with a password, with `-k -no-pass`, and with `-hashes` are three genuinely different things happening on the wire.

The lab is a two-machine network:

```text
  ROOTDC.THM.LOC     192.168.11.100    domain controller and KDC for thm.loc
  SERVER1.THM.LOC    192.168.11.51     member server hosting SHARE1 to SHARE6
```

## Getting connected, and the detour that cost the most time

Worth recording because it has nothing to do with AD. This is a THM *network* room, not a single deployable VM, so it needs the network-specific OpenVPN profile rather than the general one. I could not get that profile to work from my own machine at all.

The config API kept serving a profile pinned to an `EU-Regular-2` endpoint even though the account was provisioned on Mumbai, and hitting Regenerate did not change it. The EU endpoint was simply dead from my network: no ICMP, TCP 443 closed, and an OpenVPN `HARD_RESET` packet sent by hand got no reply. The Mumbai host from a previous room's working profile was equally silent, which ruled out my routing as the cause.

So this whole room was solved from the **AttackBox**, which is already inside the network and needs no VPN. That is the pragmatic call for a network room, and it costs you almost nothing here because every tool the room wants is preinstalled. One small correction to the task text if you go the same way: Task 4 tells you to inspect your ticket with `klist`, and `klist` is not installed on the AttackBox. `apt install krb5-user` fixes it, or you can just skip it, because the impacket tools read the ccache directly through `KRB5CCNAME` regardless.

## Task 2: Authentication in AD

Two definitions, and the room is strict about which is which. **Authentication** is proving you are who you claim to be. **Authorisation** is determining what that proven identity is allowed to reach. Authentication always happens first, and note the room uses the British spelling, which the 13-character answer mask confirms before you submit.

The wider point in this task is that AD accepts several kinds of authentication material for the same identity: a password, a certificate, or a password hash. The rest of the room is a tour of what an attacker can do with each one.

## Task 3: NetNTLM, and the first share

NetNTLM is challenge and response. The important structural detail, and the one the room asks about, is that the client authenticates to **the service** it wants to use, not to the domain controller. SERVER1 receives the response, cannot validate it itself, and passes it to ROOTDC for a verdict. The random value the server sends the client to be encrypted is the **challenge**.

That indirection is exactly what makes NTLM relay attacks possible later, since the response is not bound to the service that requested it.

With `claire` and a password, this is ordinary SMB authentication:

```bash
  # NetNTLM: plain password authentication to the member server
smbclient -L //192.168.11.51 -U 'thm.loc\claire%Password123!'

  # then pull the flag out of SHARE1
smbclient //192.168.11.51/SHARE1 -U 'thm.loc\claire%Password123!' -c 'get flag1.txt'
```

![SMB share enumeration on SERVER1 as claire over NetNTLM, listing SHARE1 through SHARE5, with flag 1 recovered](/img/thm-adauth/01-netntlm-share1.png)

All six shares are visible from the start, which is a nice bit of lab design: you can see every objective and watch access open up as you collect better credentials. Flag 1 is **`THM{5cbcc61a-3178-4220-88b4-367c1bbb48e7}`**.

## Task 4: Kerberos, tickets, and the second share

Kerberos replaces the challenge with tickets. You authenticate once to the KDC and receive a **Ticket Granting Ticket**, which you then present to request individual service tickets without sending your password again. Two facts the room tests, and both matter later:

- Every TGT is encrypted with the password hash of the **krbtgt** account. That single key is what makes the Golden Ticket in Task 5 possible.
- On Linux, the ticket cache location is read from the **KRB5CCNAME** environment variable. Every impacket tool respects it, which is the whole mechanism behind `-k -no-pass`.

```bash
  # request a TGT as mary and write it to mary.ccache
getTGT.py thm.loc/mary:'SuperLongForKerberos123!' -dc-ip 192.168.11.100

  # point the Kerberos library at that cache, then authenticate with no password at all
export KRB5CCNAME=/root/mary.ccache
smbclient.py thm.loc/mary@SERVER1.thm.loc -k -no-pass -dc-ip 192.168.11.100
```

![getTGT saving mary.ccache, then an SMB session opened with -k -no-pass listing flag2.txt in SHARE2](/img/thm-adauth/02-kerberos-tgt-share2.png)

Two details make or break this step. Kerberos is name based, so you must reach the host by its SPN hostname and not its IP, which means adding `192.168.11.51 SERVER1.thm.loc` to `/etc/hosts` first. And `-no-pass` is not a bypass, it means the password is not needed *because the ticket already proves the identity*. Flag 2 is **`THM{0d3f818a-427a-425c-a451-55e43b83e876}`**.

{{< ad >}}

## Task 5: Four weaknesses, four shares

This is the body of the room. Each flag is a different failure mode of the material described above.

### Cracking a captured NTLM hash

The room hands you `phillip`'s NTLM hash out of a secretsdump-style line. The LM half is the standard empty-password constant `aad3b435b51404eeaad3b435b51404ee`, so only the second half matters. NTLM is unsalted and very fast, which is the entire weakness:

```bash
hashcat -m 1000 hash.txt /usr/share/wordlists/rockyou.txt
hashcat -m 1000 hash.txt --show
```

It falls to rockyou almost immediately as `secret12!`, which then opens SHARE3.

![The phillip NTLM hash cracked by hashcat to secret12!, with flags 3 and 4 recovered](/img/thm-adauth/03-ntlm-crack-pth.png)

One thing that cost me a restart here, and it was self inflicted: I launched the second hashcat job while the first was still building its rockyou dictionary cache, and it died instantly with exit code 255 and no useful error. Re-running it after the first finished worked with no other change. If a hashcat invocation dies immediately on a known-good hash file, check whether another instance is already running before you start debugging the hash format.

### Pass-the-Hash

Flag 4 needs no cracking at all, which is the point being made. `ben`'s NTLM hash is enough on its own, because NTLM authentication never uses the password, only the hash derived from it:

```bash
smbclient.py thm.loc/ben@192.168.11.51 \
  -hashes aad3b435b51404eeaad3b435b51404ee:63CF41DC25C04B8FB79E44B1DEF12C10
```

A stolen hash is a working credential. That is the whole reason hash theft from LSASS is treated as equivalent to password theft.

### Kerberoasting

Any authenticated domain user can request a service ticket for any account with an SPN, and part of that ticket is encrypted with the service account's own password hash. So you can ask the DC, politely and with valid credentials, for an offline crackable artefact:

```bash
  # any domain user can do this, claire's low-privilege account is enough
GetUserSPNs.py thm.loc/claire:'Password123!' -dc-ip 192.168.11.100 -request

  # mode 13100 is Kerberos 5 TGS-REP etype 23
hashcat -m 13100 tgs.txt /usr/share/wordlists/rockyou.txt
```

`svc_printer` comes back with SPN `http/svc_print.thm.loc`, and its password cracks to `password1!`, opening SHARE5.

![GetUserSPNs returning the svc_printer SPN and the cracked TGS hash giving password1!, with flag 5](/img/thm-adauth/04-kerberoast-share5.png)

Nothing about this is anomalous traffic. Requesting a service ticket is what Kerberos is for. The weakness is entirely that a human chose the service account's password.

### The Golden Ticket

The last one is the payoff for the krbtgt fact from Task 4. If TGTs are encrypted with the krbtgt hash, then holding that hash lets you mint a TGT for anyone, including a user who does not exist, with any group memberships you care to claim. The KDC will accept it because it validates the encryption, not the origin:

```bash
ticketer.py -nthash e9a9871b93d7b4d73c91665bd6df6e50 \
  -domain-sid S-1-5-21-990021728-513958382-3715561918 \
  -domain thm.loc Administrator

export KRB5CCNAME=/root/Administrator.ccache
smbclient.py thm.loc/Administrator@SERVER1.thm.loc -k -no-pass -dc-ip 192.168.11.100
```

![ticketer.py forging Administrator.ccache from the krbtgt hash, then an SMB session as Administrator listing flag6.txt in SHARE6](/img/thm-adauth/05-golden-ticket-share6.png)

No authentication request ever reaches the domain controller for the forged identity. Flag 6 is **`THM{eac75729-86ea-4bab-98de-1c5ce3552f67}`**, and the four flags in this task are:

```text
  SHARE3  cracked NTLM hash      THM{0eef8df3-c8ea-41ad-acd7-ae0479b2badf}
  SHARE4  Pass-the-Hash          THM{284c6735-b7c1-4221-b072-abf30a54eeda}
  SHARE5  Kerberoast             THM{5b57e69d-7089-4282-ba04-c72de9bfdb38}
  SHARE6  Golden Ticket          THM{eac75729-86ea-4bab-98de-1c5ce3552f67}
```

## Task 6: What the defender sees

Two answers, both four characters, which the mask confirms before submitting. Event ID **4768** is logged when a Kerberos TGT is requested, so it is the event that shows AS-REQ activity on the DC. And in a Pass-the-Hash detection via Event ID 4624, the Authentication Package field reads **NTLM**.

That second one is the more useful detection idea. An interactive logon by a domain user that shows NTLM rather than Kerberos as the package, particularly a network logon type from a workstation that should be using Kerberos, is worth looking at. The Golden Ticket is the harder problem here, because it produces service ticket requests with no preceding TGT request, so the absence of a 4768 that should exist is the signal rather than the presence of anything.

![All seven tasks of Intro to AD Authentication marked complete on TryHackMe](/img/thm-adauth/06-room-complete.png)

## Two things worth keeping

**The credential and the proof of the credential are not the same thing, and defences usually protect only the first.** Password complexity policy, rotation, and MFA all guard the password. Pass-the-Hash, Kerberoasting, and the Golden Ticket each bypass the password entirely by stealing or forging the artefact derived from it. This is why krbtgt is the single most valuable secret in a domain and why the guidance is always to reset it twice: one reset leaves the previous key valid, so a forged ticket keeps working until the second.

**Read the answer mask before you submit, it settles spelling arguments for free.** This room wants `Authorisation`, not `Authorization`, and the 13-character mask says so unambiguously. The same check confirmed `Ticket Granting Ticket` against a `6 8 6` mask rather than the `TGT` abbreviation. Counting characters takes a second and is more reliable than guessing which English the room author writes, and it cost me zero wrong submissions across all 17 answers here.

Room solved 100%: 7 tasks, 17 answers.
