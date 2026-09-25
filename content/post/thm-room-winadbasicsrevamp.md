---
title: "TryHackMe Active Directory Basics: Build a Forest"
date: 2026-09-25T14:40:00+05:30
lastmod: 2026-09-25T14:40:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-adbasics/00-thumbnail.png

categories:
  - TryHackMe

tags:
  - tryhackme
  - thm
  - rooms
  - Active Directory
  - AD Security Testing Basics
  - Jr Penetration Tester
  - Windows
  - Group Policy
  - forest trust
  - domain controller
  - Kerberos
  - impacket
  - PowerShell

draft: false
description: "TryHackMe Active Directory Basics walkthrough: promote a child domain controller, join a server, push a Restricted Groups GPO, and build a two-way forest trust."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|Active Directory Basics |![Active Directory Basics room icon](https://cdn-images.tryhackme.com/room-icons/5c90e7db83f08eb27fc6f878f284b27601b3196c43e993a7c0ea666ca3837a66.66704dd0e54a1f39bff7b1a1-1735574588674)|

**Active Directory Basics** is the theory-plus-lab room in the AD Security Testing Basics module, and the revamped version is a lot more hands on than the name suggests. Instead of reading about domains, you are handed a five-machine network and told to build one: promote a server into a child domain controller, join another server to it, organise the directory, push a Group Policy Object, then wire up a trust to a completely separate forest. If you have already done [Attacktive Directory](/post/thm-room-attacktivedirectory/) and want to know why those attacks work, this is the room that explains the plumbing. It pairs well with [Windows Fundamentals](/post/thm-room-windows-basics/) for the operating system side.

Five of the answers are flags that cannot be guessed. A verification web app sits at `192.168.10.250:5000` and checks your configuration server-side, and only writes the flag to disk if the check passes. That design is the point of the room: you have to actually build the thing.

The lab network:

```text
  ROOTDC.THM.LOC      192.168.10.100    parent domain controller (thm.loc)
  CHILDDC             192.168.10.110    server to promote  ->  tbm.thm.loc
  FDC1.TVM.LOC        192.168.10.120    foreign forest DC  (tvm.loc)
  SERVER1             192.168.10.51     server to domain-join
  SERVER2             192.168.10.52     server in the foreign forest
```

I solved the whole thing from the Mac terminal over the room VPN using impacket, rather than clicking through RDP. That choice is what makes this writeup worth reading, because two of the tasks behave very differently when you script them.

## Task 1 to 5: the theory answers

These come straight out of the task text, and the answer-format masks confirm each one before you submit. The server that runs Active Directory services is a **Domain Controller**. The group that administers all computers and resources in a domain is **Domain Admins**. A machine account always gets a trailing dollar sign, so the account for TOM-PC is **TOM-PC$**.

On authentication, the ticket that lets you request further TGS tickets is the **Ticket Granting Ticket**. The NetNTLM question is a yes-or-no trap worth reading carefully: the challenge-response exchange sends a *response* computed from the password hash, never the password itself, so the answer is **nay**.

A group of Windows domains sharing the same namespace is a **Tree**. Forests are the layer above, joining trees that use different namespaces.

## Task 6: promoting the child domain controller

The room supplies `C:\install-domain.ps1`, which points DNS at the parent DC, resets the local Administrator password, and calls `Install-ADDSDomain` to create `tbm.thm.loc` under `thm.loc`.

Running it remotely is where I made my one real mistake, and it cost the lab. I launched the script detached and planned to reboot in a second call:

```powershell
  # what NOT to do: promotion and reboot as two separate remote calls
  Start-Process powershell -ArgumentList '-File C:\install-domain.ps1'
```

The promotion completed and left the box pending reboot. At that point every authentication attempt returned:

```text
  [-] SMB SessionError: code: 0xc0000192 - STATUS_NETLOGON_NOT_STARTED
```

That state is a genuine dead end, and it is worth understanding because it is a property of AD, not a bug. `Install-ADDSDomain` migrates the local Administrator into the new domain, so the local SAM fallback is gone. Logging into the new domain requires a domain controller. The box *is* that domain controller, and its AD services only start after the reboot. So the one action that fixes it is the one action that needs a login. I verified this properly rather than assuming: local-only logons, DCOM, the parent forest's Enterprise Admin, a native SDL FreeRDP client with an alternate shell, and an AttackBox RDP console all failed the same way, with RDP specifically timing out at `ERRCONNECT_ACTIVATION_TIMEOUT`. I burned the network's single reset to recover.

The fix is to never let the box strand itself. Chain the reboot into the same invocation:

```powershell
  # run-promo.ps1, uploaded over SMB and launched once
  & C:\install-domain.ps1 *> C:\promo.log
  Start-Sleep -Seconds 5
  Restart-Computer -Force
```

Upload it with impacket rather than fighting shell quoting through the WMI layer, which mangled my first two attempts:

```bash
  smbclient.py 'THM.LOC/Administrator:<password>@192.168.10.110'
  # use C$
  # put run-promo.ps1

  wmiexec.py -silentcommand 'THM.LOC/Administrator:<password>@192.168.10.110' \
    'powershell -ExecutionPolicy Bypass -Command "Start-Process powershell.exe -ArgumentList @(\"-File\",\"C:\run-promo.ps1\") -WindowStyle Hidden"'
```

This time it promoted, rebooted, and came back on its own:

```text
  CDC1
  tbm.thm.loc
  thm.loc
```

A detail worth knowing for the poll loop: LDAP on 389 and Kerberos on 88 are the signals that AD is actually live. Do not test them with a glob like `*389:UP*`, because `3389` matches it and RDP is up the whole time. That false positive had me convinced the DC was ready twenty minutes before it was.

Trigger the check and read the flag:

```bash
  curl -s -X POST http://192.168.10.250:5000/run/tbm_domain_promotion
  wmiexec.py 'tbm.thm.loc/Administrator:<password>@192.168.10.110' 'type C:\flag1.txt'
```

Flag one is **`THM{caf78a39-1e8b-4ec2-8eaf-e38a42590d1b}`**.

{{< ad >}}

## Task 7: reading the directory

The promotion pre-populates the domain. The People OU holds five departments, and the fourth is **Marketing**, which is the answer whether you sort alphabetically the way ADUC displays them or take them in creation order.

The second question asks how many bankers service private clients. There is no "private clients" title on any user, which is the misdirection. The answer lives in the Groups OU, in a group called Private Clients:

```bash
  Get-ADGroupMember -Server localhost -Identity "Private Clients" |
    Select-Object -ExpandProperty DistinguishedName
```

All eleven members sit in `OU=Bankers,OU=People`, so the answer is **11**. I nearly answered 6, because I had listed the Bankers OU with `tail -30` and quietly truncated five names off the end. Checking each member's DN instead of eyeballing two lists is what caught it.

## Task 8: domain-joining Server1

Same pattern as Task 6, and the same lesson applies, so the reboot goes in the wrapper again:

```powershell
  & C:\join-domain.ps1 *> C:\join.log
  Start-Sleep -Seconds 5
  Restart-Computer -Force
```

Server1 came back as a member of `tbm.thm.loc`. Unlike the DC promotion, a plain domain join leaves the local accounts intact, so this one is far more forgiving if you get the sequencing wrong.

Flag two is **`THM{941c5c55-f17a-422f-b7c3-7bb2386f187e}`**.

## Task 9: organising computers into OUs

Everything lands in the `Computers` container by default. Three servers and three laptops need sorting:

```powershell
  foreach ($c in @("WEB-SERVER","FILE-SERVER","SERVER1")) {
    Move-ADObject -Server localhost -Identity "CN=$c,CN=Computers,DC=tbm,DC=thm,DC=loc" `
      -TargetPath "OU=Servers,DC=tbm,DC=thm,DC=loc"
  }
```

The laptops go to the Workstations OU the same way, which leaves **3** machines there. This matters for the next task: a GPO linked to the Servers OU only reaches Server1 because Server1 now lives in that OU.

## Task 10: the Restricted Groups GPO, and how it locked me out

The goal is to make the Product Admins group a local administrator on every server in the Servers OU. The network share used to distribute GPOs to domain machines is **SYSVOL**.

There is no PowerShell cmdlet for Restricted Groups, so the policy has to be written as a security template into SYSVOL, with the security client-side extension registered on the GPO object. My first version used the `__Members` form:

```ini
  [Group Membership]
  *S-1-5-32-544__Memberof =
  *S-1-5-32-544__Members = *S-1-5-21-...-1119
```

It applied, and it locked me out of Server1:

```text
  [-] rpc_s_access_denied
```

`__Members` is **authoritative**. It does not add Product Admins to the local Administrators group, it declares that Administrators shall contain exactly that one group and nothing else. Domain Admins got evicted. Checking with a Product Admins account confirmed it precisely:

```text
  SERVER1\Administrator
  TBM\Product Admins
```

The GUI flow the room walks you through produces the other form, where you pick a group and say which group it is a member of. That is additive:

```ini
  [Group Membership]
  *S-1-5-21-...-1119__Memberof = *S-1-5-32-544
```

Worth noting that Restricted Groups does not undo its own damage. Switching the template stops the enforcement but does not give Domain Admins back, so I re-added it manually. The recovery only worked because terry.fox, a Product Admins member, was still an administrator on that box thanks to the very policy that had evicted everyone else.

After `gpupdate /force`, Server1 shows both:

```text
  SERVER1\Administrator
  SERVER1\THMSetup
  TBM\Domain Admins
  TBM\Product Admins
```

Flag three is **`THM{2d8fa7ec-c925-425d-bbd3-ba02f03219f5}`**.

## Task 11: the foreign forest trust

Now the interesting part. TryVendorMe (`tvm.loc`) is a separate forest, and it needs a two-way trust with `thm.loc`.

My first attempt used netdom and reported success, but produced the wrong kind of trust:

```text
  Name             : thm.loc
  Direction        : BiDirectional
  ForestTransitive : False
```

`ForestTransitive: False` means this is an **external** trust, not a forest trust. That distinction is the whole task. An external trust to `thm.loc` stops there, but the second half of this task needs a user from `tvm.loc` to be granted rights inside `tbm.thm.loc`, the child domain. Only a forest trust is transitive across to it. Had I not checked the trust type and just trusted the "command completed successfully" message, the last flag would have been unreachable for reasons that look nothing like the cause.

The .NET Forest API creates the correct object:

```powershell
  $ctxT = New-Object System.DirectoryServices.ActiveDirectory.DirectoryContext('Forest','tvm.loc')
  $tvm  = [System.DirectoryServices.ActiveDirectory.Forest]::GetForest($ctxT)
  $ctxH = New-Object System.DirectoryServices.ActiveDirectory.DirectoryContext('Forest','thm.loc','THM.LOC\Administrator','<password>')
  $thm  = [System.DirectoryServices.ActiveDirectory.Forest]::GetForest($ctxH)
  $tvm.CreateTrustRelationship($thm,'Bidirectional')
```

```text
  Name             : thm.loc
  Direction        : BiDirectional
  ForestTransitive : True
```

Adding a user across a forest boundary is its own puzzle. `Add-ADGroupMember` with a foreign user fails, and creating the ForeignSecurityPrincipal by hand fails too because `New-ADObject` will not set the required `objectSid`. The form that works is an ADSI bind by SID, which makes the DC create the FSP for you:

```powershell
  $grp = [ADSI]("LDAP://CN=Server Admins,OU=Groups,DC=tvm,DC=loc")
  $grp.Add("LDAP://<SID=S-1-5-21-990021728-513958382-3715561918-1113>")
```

The membership then shows up as a ForeignSecurityPrincipal, and `Get-ADGroupMember` throws an error while the raw `member` attribute reads back fine:

```text
  CN=S-1-5-21-990021728-513958382-3715561918-1113,CN=ForeignSecurityPrincipals,DC=tvm,DC=loc
```

One honest note on verification. My first run of the Claire check did not distribute a flag, and cross-forest NTLM through impacket failed with `STATUS_INTERNAL_ERROR`, which looked like a broken trust. It was not. Testing the logon path directly proved the trust worked:

```text
  RDP  192.168.10.52  SERVER2  [+] THM.LOC\Claire:<password> (Pwn3d!)
```

Re-running the check after that returned the flag. Claire reaches Server2 because Server Admins is a local administrator there, granted through the forest trust.

Flag four is **`THM{3ad3060c-429e-42e0-98ca-318b3227c742}`**.

The last flag is the payoff, and the best illustration of why trust direction and transitivity matter. Adding `tvm\alice.king` to Product Admins in `tbm.thm.loc` chains four separate things together:

- alice.king is managed in `tvm.loc`
- `tvm.loc` and `thm.loc` have a two-way forest trust
- `tbm.thm.loc` is a child of `thm.loc`, so it inherits that trust transitively
- Product Admins is a local admin on Server1 because of the Task 10 GPO

Which means a user in a completely different forest ends up with administrative rights on a server two domains away:

```text
  RDP  192.168.10.51  SERVER1  [+] TVM.LOC\alice.king:<password> (Pwn3d!)
```

Flag five is **`THM{2d159874-69b3-4778-b9f9-13b047fa83a2}`**.

## Two things worth keeping

**A Restricted Groups policy is a replacement, not an addition.** The `__Members` directive defines the complete membership of the target group, so pushing it to add one group silently removes every other administrator, including Domain Admins. The `__Memberof` directive is the additive one. On a real estate this is the difference between granting an application team local admin and locking your own operations team out of every server in an OU at once, and the policy will not restore what it removed when you correct it.

**Verify the type of the object you created, not just that the command succeeded.** `netdom` cheerfully reported success while creating an external trust where a forest trust was required. Both are two-way, both show as BiDirectional, and the difference only surfaces one task later when transitivity to a child domain silently fails. `Get-ADTrust` and one look at `ForestTransitive` costs nothing. The same instinct applies to the promotion trap: a promoted domain controller pending reboot has no valid logon path at all, so any automation that promotes a DC must carry its own reboot in the same invocation.

Room solved 100%: 12 tasks, 17 answers.
