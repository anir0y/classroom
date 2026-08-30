---
title: "TryHackMe Monitoring AWS Services Walkthrough"
date: 2026-08-18T11:45:00+05:30
lastmod: 2026-08-18T11:45:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-awsservices/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - SOC Level 2
  - AWS
  - S3
  - RDS
  - CloudTrail
  - GuardDuty
  - Cloud Security
  - Splunk
  - Blue Team

draft: false
description: "Walkthrough of TryHackMe Monitoring AWS Services: a public S3 bucket policy and the filename brute force that followed, SSH open to the world on EC2, an Internet-exposed RDS instance that needed two changes, IAM discovery, and Denial of Wallet."
---

## Monitoring AWS Services

Fourth room in the **Cloud Security for SOC** module, after [Cloud Security Pitfalls](/post/thm-room-cloudsecuritypitfalls/), [AWS Security Logging](/post/thm-room-awssecuritylogging/) and [Monitoring AWS Logins](/post/thm-room-monitoringawslogins/). The previous room covered the **control plane**, who logs in. This one is the **managed services** layer: what those logins misconfigure, and how the internet finds it.

Seven tasks, fifteen answers, all solved 100%. One index per scenario again:

```
index=* | stats count by index, sourcetype
#   task2   aws:cloudtrail            389
#   task3   aws:cloudtrail            505
#   task3   aws:cloudwatch:guardduty    1
#   task4   aws:cloudtrail            170
#   task5   aws:cloudtrail             12
```

![TryHackMe Monitoring AWS Services at 100%, all seven tasks complete](/img/thm-awsservices/04-room-complete.png)

The room's own framing is the reason it is worth doing: with 200-plus AWS services you cannot learn every attack path, but roughly 80% of attacks on AWS services are catchable with about 20% of the effort. Every task here is one of those cheap, high-yield detections.

## Task 2: two bucket policies that look the same and are not

Three write events tell the whole story, and putting them in one table is the entire investigation:

![Splunk showing PutBucketPublicAccessBlock, then a policy with an IP condition, then a policy with none](/img/thm-awsservices/01-s3-policies.png)

```
index=task2 (eventName=PutBucketPublicAccessBlock OR eventName=PutBucketPolicy)
| rex field=_raw "\"Sid\": \"(?<Sid>[^\"]+)"
| rex field=_raw "\"aws:SourceIp\": \[\"(?<Condition>[^\"]+)"
| eval Condition=if(isnull(Condition),"(none - fully public)",Condition)
| table _time, eventName, "userIdentity.userName", Sid, Condition
```

| Time | Event | Sid | Condition |
|---|---|---|---|
| **17:48:12** | PutBucketPublicAccessBlock |, |, |
| 17:55:15 | PutBucketPolicy | `AllowAccessOnlyFromTorontoOffice` | `67.55.61.83/32` |
| **17:58:45** | PutBucketPolicy | **`TempAccessDeniedDebug`** | **none, fully public** |

Alex disabled the Public Access Block at **2025-12-31 17:48:12**, and the policy that actually made the bucket public is **TempAccessDeniedDebug**.

That middle row is the part worth slowing down on. Both policies have `"Principal": "*"` and `"Action": "s3:GetObject"`, so a detection keyed on `Principal: *` alone flags both, and the first one is *fine*, because a `Condition` block restricts it to a single office IP. The second policy drops the condition entirely. **In S3, `Principal: *` is not the finding; `Principal: *` with no `Condition` is.** That distinction is the single most useful thing in this task, and it is also a good argument for extracting the condition into its own field rather than eyeballing raw JSON.

The name is its own tell. `TempAccessDeniedDebug` is what someone types at 17:58 when the properly-scoped policy three minutes earlier did not work and they want to see whether permissions are the problem. Nothing about it is malicious. It is just never removed.

Twenty-two minutes later, the internet notices:

![Splunk showing 52 AccessDenied GetObject attempts from 212.8.250.220 with a filename wordlist](/img/thm-awsservices/02-bucket-scan.png)

```
index=task2 eventName=GetObject
| stats count, dc("requestParameters.key") as distinct_keys, values("requestParameters.key") as got
  by sourceIPAddress, "userIdentity.type", errorCode
#   212.8.250.220   AWSAccount   AccessDenied   52   52   ansible.tar.gz, archive.zip, backup.7z, backup.sql...
#   212.8.250.220   AWSAccount   success         1    1   repo.zip
```

The scan came from **212.8.250.220** and ran 18:20:05 → 18:24:25. **53** filenames were attempted and **repo.zip** is the one that existed.

Look at the key list: `backup.sql`, `backup.tar.gz`, `archive.zip`, `artifact.zip`. This is a dictionary of *guessed* object names, not enumeration, the policy granted `s3:GetObject` but never `s3:ListBucket`, so the scanner could not list the bucket and had to brute-force filenames instead. Fifty-two misses and one hit. That 52:1 ratio of `AccessDenied` to success from a single `AWSAccount`-type principal is a far better alert than any single event, and it needs no threat intel at all.

## Task 3: SSH open to the world

{{< ad >}}

A clean four-event sequence from `emma.watson`:

```
index=task3 (eventName=CreateSecurityGroup OR eventName=AuthorizeSecurityGroupIngress
             OR eventName=RunInstances OR eventName=RevokeSecurityGroupIngress)
#   20:39:26  CreateSecurityGroup           website-access-sg
#   20:39:27  AuthorizeSecurityGroupIngress sg-088dacb4d53945be6  →  22, 80, 443 from 0.0.0.0/0
#   20:40:44  RunInstances                  i-082579354380296e6
#   21:58:34  RevokeSecurityGroupIngress    sg-088dacb4d53945be6
```

The group is **website-access-sg** and the risky service is **SSH**, ports 80 and 443 open to the world are exactly what a website needs, but port **22** is not. The instance is **i-082579354380296e6**, and Emma revoked the rule at **2025-12-31 21:58:34**.

GuardDuty caught it thirteen minutes before she did:

```
index=task3 sourcetype=aws:cloudwatch:guardduty
#   21:45:48  Recon:EC2/PortProbeUnprotectedPort   sev 2
#   "LocalPortDetails": {"Port": 22, "PortName": "SSH"}
#   "RemoteIpDetails": {"IpAddressV4": "45.78.205.134", "City": "Singapore", "AsnOrg": "BYTEPLUS"}
```

The probing address is **45.78.205.134**.

Two things to take from the timing. The instance was exposed at 20:40 and probed by 21:45, **about an hour** from "SSH open to 0.0.0.0/0" to a known-malicious host knocking on it. That is the realistic clock on internet-facing misconfiguration, and it is why "we will fix it tomorrow" is not a plan. And the severity is **2** out of 10, so a SOC filtering GuardDuty to medium-and-above would never have seen it. The finding that mattered here was one of the quiet ones.

## Task 4: an Internet-exposed database takes two mistakes

This is the sharpest question in the room, because the answer is a *pair* of events rather than one:

![Splunk showing the RDS timeline: ingress from a /32, DB created not public, then publiclyAccessible true, then the security group opened to 0.0.0.0/0](/img/thm-awsservices/03-rds-exposure.png)

```
index=task4 (eventName=CreateDBInstance OR eventName=ModifyDBInstance
             OR eventName=AuthorizeSecurityGroupIngress OR eventName=ModifySecurityGroupRules)
#   18:03:01  AuthorizeSecurityGroupIngress  27296a2c   3306 from 73.88.127.8/32
#   18:03:03  CreateDBInstance               31465277   db-thm-preprod-qa   publiclyAccessible: false
#   18:10:37  ModifyDBInstance               dcb54877   db-thm-preprod-qa   publiclyAccessible: TRUE
#   18:13:30  ModifySecurityGroupRules       0a3b23c1   3306 from 0.0.0.0/0
```

The instance is **db-thm-preprod-qa**, and the two events that indicate Internet exposure, in order, are **dcb54877, 0a3b23c1**.

The reason both are required is worth internalising. `publiclyAccessible: true` gives the RDS instance a public DNS name and a routable address, but the security group still decides who may connect, with the original `73.88.127.8/32` rule in place, the database was reachable only from one office. Conversely, a security group open to `0.0.0.0/0` on a *non*-public instance is harmless from the internet, because there is nothing to route to. **Neither event is an incident on its own; together they are a MySQL port open to the world.**

That is a correlation rule rather than a signature, and it is the kind of thing SIEM is actually good at: alert when the same `dBInstanceIdentifier` sees `publiclyAccessible: true` and its attached security group has a `0.0.0.0/0` rule. Note also the two events are three minutes apart and were almost certainly done by someone debugging why they could not connect to a pre-prod QA database, the same pattern as `TempAccessDeniedDebug` in Task 2, one layer down the stack.

## Task 5: what discovery looks like from inside

Twelve events, and they read like a checklist:

```
index=task5 | table _time, eventName, "requestParameters.userName" | sort _time
#   08:48:21  GetCallerIdentity                            <- who am I?
#   08:48:31  ListAttachedUserPolicies   jose.martinez     <- what can I do?
#   08:48:43  GetAccountSummary
#   08:48:55  ListUsers                                    <- who else is here?
#   08:49:15  DescribeTrails                               <- is anyone watching?
#   08:49:22  ListFunctions20150331
#   08:49:26  DescribeDBInstances
#   08:49:31  DescribeInstances
#   08:49:39  ListBuckets
#   08:49:58  ListAttachedUserPolicies   lars.andersen     <- who is worth taking?
#   08:50:15  CreateAccessKey            lars.andersen     <- backdoor
#   08:50:38  ListAccessKeys             lars.andersen
```

The second Discovery command is **ListAttachedUserPolicies**, and the user discovered and backdoored is **lars.andersen**.

Two minutes, start to finish, and the shape is what makes it detectable rather than any single call. `GetCallerIdentity` → `ListAttachedUserPolicies` on *yourself* is the universal "what did I just steal" opener. `DescribeTrails` in the middle is the one I would alert on hardest: a legitimate user has no reason to ask which CloudTrail trails exist, and it means the intruder is checking whether they are being logged, the same instinct as the GuardDuty enumeration in [AWS Security Logging](/post/thm-room-awssecuritylogging/).

The finish is `CreateAccessKey` for a *different* user. That is the actual persistence: a long-term key on someone else's identity, which survives resetting the compromised account's password and looks like `lars.andersen` in every log afterwards.

## Task 6: Denial of Wallet

No lab data, two knowledge answers. **DoW** is **Denial of Wallet**, and yes, **Yea**, you should monitor it with the same effort as DoS.

The logic is genuinely worth carrying. Autoscaling, serverless, CDNs and WAFs have made classic DoS expensive to pull off, but every one of those defences bills per unit: per Lambda invocation, per scaled EC2 instance, per `GetObject`, per gigabyte egressed, sometimes per WAF-blocked request. So the attack that used to take you offline now just runs your bill up instead, and an attacker who *fails* to knock you over may still have succeeded. The room is blunt that a SOC can detect a request spike and block offending IPs but cannot remediate it, that is a budget-alarm and rate-limit conversation with the IT team.

## Task 7: what carries forward

Two things.

**Every exposure in this room was created by someone doing their job.** A debug bucket policy, port 22 left in a website security group, a QA database flipped to publicly accessible so someone could connect, no credential theft, no exploit, and in two of the three cases the person came back and fixed it themselves. The attacker's only contribution was arriving during the window: 22 minutes for the bucket, about an hour for the SSH port. Detection here is not about finding intruders, it is about finding *your own* misconfigurations faster than the internet scans for them.

**And the highest-value AWS detections are two-field correlations, not single events.** `Principal: *` means nothing without checking for a `Condition`. `publiclyAccessible: true` means nothing without the security group. A `GetObject` failure means nothing until you count 52 of them against one source. Each of those is cheap to write and each covers a whole class of attack, which is exactly the 80/20 the room opens with. The single-event alerts are the ones that drown you; the paired ones are the ones worth having.

Room solved 100%: seven tasks, fifteen answers, and the fourth of five rooms in Cloud Security for SOC.
