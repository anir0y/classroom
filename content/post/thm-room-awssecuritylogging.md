---
title: "TryHackMe AWS Security Logging Walkthrough"
date: 2026-08-18T09:25:00+05:30
lastmod: 2026-08-18T09:25:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-awslogging/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - SOC Level 2
  - AWS
  - CloudTrail
  - GuardDuty
  - Cloud Security
  - Splunk
  - Blue Team

draft: false
description: "Walkthrough of TryHackMe AWS Security Logging: CloudTrail console logins and bucket creation, three GuardDuty findings ending in an XMRig miner, CloudFront access logs, and the S3 data event that ties the intrusion together."
---

## AWS Security Logging

Second room in the **Cloud Security for SOC** module, after [Cloud Security Pitfalls](/post/thm-room-cloudsecuritypitfalls/). That room was vocabulary; this one is the first with actual AWS logs in a SIEM, and it walks the three security areas it defined, **control plane**, **managed services**, **workloads**, one task at a time.

Seven tasks, sixteen answers, all solved 100%. One Splunk index and three sourcetypes:

```
index=* | stats count by index, sourcetype
#   aws   aws:cloudtrail            2105
#   aws   aws:cloudfront:custom      499
#   aws   aws:cloudwatch:guardduty     3
```

Note the shape of that: 2105 CloudTrail events, and **three** GuardDuty findings. CloudTrail is the raw record of every API call and it is almost entirely noise; GuardDuty is AWS's own detection layer and it fires three times in the whole dataset. Both matter, and the room is built so that you need each one to answer questions the other cannot.

Data is dated **12 December 2025**, so set the picker to **All time**.

## Task 2: the three areas

Two definitions, and they are the module's spine. The area covering management actions inside the AWS console is the **Control Plane**. The service providing lab machines in the cloud is **Amazon EC2**.

One small trap on the second: answering `EC2` is rejected with *"Your answer is too short"* rather than *"incorrect"*, which is a helpful distinction, it means you have the right idea and the wrong string. **Amazon EC2** is accepted.

## Task 3: CloudTrail and the control plane

The first real query. Console logins live in CloudTrail as `eventName=ConsoleLogin`:

```
index=aws sourcetype=aws:cloudtrail jeff.harrison eventName=ConsoleLogin
| eval t=strftime(_time,"%F %H:%M:%S")
| table t, sourceIPAddress, recipientAccountId, awsRegion, "responseElements.ConsoleLogin"
#   15:26:54  149.40.62.48  398985017225  eu-north-1  Failure
#   15:39:29  149.40.62.48  398985017225  us-east-2   Success
```

So jeff.harrison logged in from **149.40.62.48** to account **398985017225**.

Two details worth keeping. The failure and the success are thirteen minutes apart and in **different regions**, `eu-north-1` then `us-east-2`, which is normal for console sign-in events and a good reminder that `awsRegion` on a `ConsoleLogin` tells you which endpoint answered, not where the user is. And `responseElements.ConsoleLogin` is the field carrying Success/Failure; there is no separate event name for a failed login the way there is an Event ID 4625 on-premises.

The bucket question warns you that you will need to change your query, and that is because bucket creation is not a login event:

```
index=aws sourcetype=aws:cloudtrail eventName=CreateBucket
| table _time, sourceIPAddress, "userIdentity.userName", "requestParameters.bucketName", awsRegion
#   15:41:09  149.40.62.48  jeff.harrison  prod-website-thm  eu-central-1
```

The bucket is **prod-website-thm**, created ninety seconds after the successful login.

## Task 4: GuardDuty, and an attacker checking whether they were caught

{{< ad >}}

Three findings, and reading all three in order is the whole task:

```
index=aws sourcetype=aws:cloudwatch:guardduty
| eval t=strftime(_time,"%H:%M:%S") | table t, Type, Severity | sort t
#   16:46:23  Discovery:IAMUser/AnomalousBehavior       sev 2
#   16:59:43  CryptoCurrency:EC2/BitcoinTool.B!DNS      sev 8
#   17:12:47  Execution:EC2/MaliciousFile               (EBS scan)
```

The first finding's description names the source outright:

```
One or more API calls were invoked from 185.183.33.33 located in Netherlands
from ProtonVPN (ASN=49981).
GuardDuty considers these invocations suspicious because:
- The organization WorldStream B.V. (ASN=49981) has not been previously observed for this account.
```

The VPN is **ProtonVPN**. GuardDuty is doing ASN reputation here rather than geolocation, the reason given is that this *organisation* has never been seen for this account before, which is a far more durable signal than "unusual country".

Now read what the alert says was actually done. The APIs invoked were `ListFindings`, `GetDetector`, `ListDetectors`, `ListMembers`, `GetFindingsStatistics`, `ListFilters`, `ListOrganizationAdminAccounts`, all `guardduty.amazonaws.com`. **The attacker was enumerating GuardDuty itself**, checking what detection existed and whether anything had already fired on them. GuardDuty then flagged that enumeration as Discovery-tactic anomalous behaviour. That is a genuinely nice piece of scenario design and it is the single most interesting event in the room.

The other two findings are the payload. The DNS finding carries the domain in `Service.Action.DnsRequestAction`:

```
"DnsRequestAction": { "Domain": "donate.v2.xmrig.com", "DomainWithSuffix": "xmrig.com", "Protocol": "UDP" }
"AdditionalInfo": { "threatName": "suspicious:mining/stratum" }
```

And the malicious-file finding is an **EBS volume scan**, GuardDuty snapshotted the disk and scanned 68,217 files across 2 GB:

```
"ThreatDetectedByName": { "ThreatNames": [{
   "Name": "CoinMiner:Linux/Xmrig.Gen", "Severity": "HIGH",
   "FilePaths": [{ "FileName": "xmrig",
                   "FilePath": "/home/ubuntu/xmrig-6.24.0/xmrig",
                   "Hash": "fb1f928c2dbfd108da2d93b9e07a8d97526dc378dc342d405f3991ad6bec969d" }] }] }
```

So the path is **/home/ubuntu/xmrig-6.24.0/xmrig** and the queried domain is **donate.v2.xmrig.com**.

Worth noticing that the scan reports the same hash twice, once for the extracted binary and once as `xmrig-6.24.0-noble-x64.tar.gz=>xmrig-6.24.0/xmrig`, the copy still inside the downloaded tarball. The `=>` notation means "inside this archive". Answer with the plain extracted path.

Then back to CloudTrail for instance context:

```
index=aws sourcetype=aws:cloudtrail eventName=RunInstances
| table _time, "userIdentity.arn", sourceIPAddress, "responseElements.instancesSet.items{}.instanceId"
#   15:17:18  arn:aws:iam::398985017225:root  78.82.223.16  i-04fa0268276e1f763
#   15:19:17  arn:aws:iam::398985017225:root  78.82.223.16  i-0cc1b6177a93db6d5
```

The creator is **arn:aws:iam::398985017225:root**, the account root, which should never be used for routine work and is the actual root cause of everything that follows.

The exposed-ports question has a query trap worth flagging. The obvious event name is `AuthorizeSecurityGroupIngress`, and it returns **nothing**. The console used a different API:

```
index=aws sourcetype=aws:cloudtrail eventName=ModifySecurityGroupRules
#   15:19:56  sgr-0cb6912aa908667ff  CidrIpv4 0.0.0.0/0  FromPort 22    ToPort 22    tcp
#   15:19:57  sgr-08c475641b7360c19  CidrIpv4 0.0.0.0/0  FromPort 3389  ToPort 3389  tcp
```

**22, 3389**, SSH and RDP, both open to the entire internet, one second apart, thirty-nine seconds after the instance was launched. When an event name you are confident about returns zero results in CloudTrail, search on the *parameter* instead (`fromPort`, `ipPermissions`) and let Splunk tell you which API actually fired; the console and the CLI often call different ones.

## Task 5: managed services, CloudFront and S3 data events

CloudFront access logs are ordinary web logs, so the admin portal question is a `cs_uri_stem` filter:

```
index=aws sourcetype=aws:cloudfront:custom cs_uri_stem="/admin/*"
| table _time, c_ip, cs_method, cs_uri_stem, sc_status
#   15:39:59  168.84.119.124  POST  /admin/login      401
#   15:40:33  168.84.119.124  POST  /admin/login      200
#   15:40:59  168.84.119.124  GET   /admin/dashboard  200
```

**168.84.119.124**, one failure, then success, then the dashboard. Note this is a *third* address, distinct from jeff.harrison's AWS console IP and from the ProtonVPN address; CloudFront sees the website's visitors, CloudTrail sees the AWS account's operators, and they are different populations.

The keyword question is a distinct count, not an event count:

```
index=aws sourcetype=aws:cloudfront:custom cs_uri_stem="/search" tryhackme
| stats dc(c_ip) as ips, count
#   ips 14   count 14
```

**14** IPs, one search each, so `count` and `dc(c_ip)` agree here, but they would not have to, and `dc()` is the one that answers the question as asked.

Finally the S3 data events. These are `eventCategory=Data` in CloudTrail, and they are the record of object-level access rather than bucket-level management:

```
index=aws sourcetype=aws:cloudtrail eventCategory=Data
| stats count, values(eventName) as evs by "requestParameters.key"
#   admin/backup.tar.gz   3   GetObject, HeadObject, PreflightRequest
#   index.html            3   GetObject, HeadObject, PreflightRequest
#   admin/                1   PreflightRequest
#   aoc.png               1   PreflightRequest
```

The interesting file is **backup.tar.gz**. On answer format: `admin/backup.tar.gz` is rejected with *"The answer provided may not be in English"*, a validation quirk triggered by the slash rather than a wrong answer. The bare filename is accepted.

And here is the part the room does not point out, which is the best reason to run the query yourself:

```
index=aws sourcetype=aws:cloudtrail "requestParameters.key"="admin/backup.tar.gz"
#   16:29:55  HeadObject  185.183.33.33
#   16:29:57  GetObject   185.183.33.33
```

**That is the ProtonVPN address from Task 4's GuardDuty finding.** The same session downloaded the admin backup at 16:29:57 and then enumerated GuardDuty at 16:30:43, take the data first, then check whether anyone noticed. The two tasks are presented as separate exercises about separate log sources, and they are the same intrusion sixteen minutes apart.

## Task 6: workloads

The last two definitions. A service built and maintained by the cloud vendor is a **Managed Service**. And the cloud-native alternative to Auditd, which the room notes does not work effectively inside containers, is **Falco**, the same tool that came up in [Cloud Security Pitfalls](/post/thm-room-cloudsecuritypitfalls/) as a CWPP example.

The framing is worth keeping: if you run PostgreSQL on EC2 instead of using Aurora, or Nginx instead of an AWS load balancer, you have opted out of AWS's logging and opted back into installing SIEM agents, deploying Auditd or Sysmon, and tracking your own vulnerabilities. Unmanaged infrastructure in the cloud is just on-premises infrastructure with someone else's power bill.

## Task 7: what to take away

Two things.

**The three log sources answer three different questions, and none of them is a substitute for another.** CloudTrail told us who created the instance, who opened 22 and 3389, and who pulled the backup, but it never once said "this is bad". GuardDuty said "this is bad" three times and gave a malware path and a hash, but it could not tell us who launched the instance or who exposed the ports. CloudFront saw an entire population of users that never appears in CloudTrail at all. The room's structure is the lesson: control plane, managed services, workloads, each with its own source.

**And detection evasion now includes reading the detection tooling.** The Discovery finding is not `ListBuckets` or `GetCallerIdentity`; it is `ListFindings`, `GetFindingsStatistics`, `ListDetectors`, an attacker with root credentials opening GuardDuty to see whether they had been caught. Any identity enumerating your security services is worth an alert on its own, because there is no benign reason for a workload to call `GetFindingsStatistics`, and it is one of the few actions that tells you the intruder is *aware of* your detection rather than merely subject to it.

Room solved 100%: seven tasks, sixteen answers, and the second of five rooms in Cloud Security for SOC.
