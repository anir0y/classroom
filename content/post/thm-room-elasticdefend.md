---
title: "TryHackMe Elastic: Using Elastic Defend Walkthrough"
date: 2026-08-14T18:40:00+05:30
lastmod: 2026-08-14T18:45:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-elasticdefend/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - SOC Level 2
  - Elastic
  - EDR
  - Threat Hunting
  - Blue Team

draft: false
description: "Walkthrough of TryHackMe Elastic: Using Elastic Defend: configure the integration, explore endpoint telemetry, and triage EDR alerts via the Elasticsearch API."
---

## Using Elastic Defend

This is the follow-on to [Elastic: Setting up a SOC Lab](/post/thm-room-elasticlab/), and it moves from centralized log collection to endpoint security. Elastic Defend is the EDR component of the Elastic Security suite: an agent-side capability that collects rich process, file, and network telemetry, and can detect or prevent malicious activity on the host itself. Over seven tasks you configure the Defend integration, explore its telemetry in Discover, reconstruct a process chain from a script execution, and then generate and triage three real detection alerts (a blocked EICAR file, a shadow-file read, and a cron persistence attack).

The lab hands you a fully built stack and the `elastic` superuser password, and the intended path is entirely through the Kibana UI. That works, but every answer in this room is a value sitting in an Elasticsearch index or in a script on disk. Since the room gives you both a terminal and the credentials, the fastest and most exact way to answer is to query Elasticsearch directly with `curl` and read the scripts. That is the approach below, and the grader confirmed all fifteen answers.

![Elastic: Using Elastic Defend room completed on TryHackMe, all seven tasks done and 120 points earned](/img/thm-elasticdefend/03-room-complete.png)

A quick setup note that the rest of the room depends on. Elasticsearch is on `https://localhost:9200` (self-signed, so `curl -k`) and Kibana is on `http://localhost:5601`. A small shell helper keeps the later queries short:

```bash
export PW='<elastic password from the task>'
ES='https://localhost:9200'
q(){ curl -sk -u elastic:$PW "$ES/$1/_search" -H 'Content-Type: application/json' -d "$2"; }
```

## Task 2: what Elastic Defend is, and its configuration

Elastic Defend has two independent capabilities: a telemetry collector (visibility only) and NGAV/EDR (prevention and detection). The room has you inspect the pre-installed `defend-integration` policy in Fleet. Both answers live in that policy object, which the Fleet API returns directly:

```bash
curl -s -u elastic:$PW 'http://localhost:5601/api/fleet/package_policies' -H 'kbn-xsrf: true'
# package endpoint version 9.2.0
# inputs[].config.policy.value.linux.malware.mode = prevent
```

The installed Elastic Defend (endpoint) integration version is **9.2.0**, and the default protection level for Malware is **Prevent**, which means Defend does not just alert on malicious activity, it blocks or quarantines it. That default is exactly why the EICAR file in Task 5 never lands on disk.

## Task 3: endpoint telemetry in Discover

Defend writes its telemetry into three data streams, `logs-endpoint.events.process-*`, `logs-endpoint.events.network-*`, and `logs-endpoint.events.file-*`, which the room surfaces through a custom Data View. The two questions are simple aggregations:

{{< ad >}}

```bash
# full process.name for the Python process
q 'logs-endpoint.events.process-*' '{"size":0,"query":{"wildcard":{"process.name":"*python*"}},"aggs":{"n":{"terms":{"field":"process.name"}}}}'
#   -> python3.12
# top network.type value
q 'logs-endpoint.events.network-*' '{"size":0,"aggs":{"n":{"terms":{"field":"network.type"}}}}'
#   -> ipv4 (38), ipv6 (2)
```

The full `process.name` for the Python process is **python3.12**, and the top `network.type` value is **ipv4**.

## Task 4: reconstructing a process chain

This is the core investigation skill of the room. You run `discovery.sh`, and Defend records the whole process lifecycle. The important field is `process.entity_id`, a globally unique, non-reusable identifier for each process instance. Unlike a PID, it lets you reliably correlate a parent to its children. First, locate the script execution event:

```bash
q 'logs-endpoint.events.process-*' '{"query":{"wildcard":{"process.args":"*discovery.sh*"}},"_source":["event.action","process.parent.executable","process.entity_id","process.command_line"],"sort":[{"@timestamp":"asc"}]}'
# /bin/bash ./discovery.sh | parent.executable = /usr/bin/bash | entity_id = ZBvRmh7FGyOMXs44OIsEag
```

The `process.parent.executable` for the located event is **/usr/bin/bash**. Then pivot on that entity ID against `process.parent.entity_id` (filtering to `event.action: exec`, sorted oldest first) to list every command the script spawned:

```bash
q 'logs-endpoint.events.process-*' '{"query":{"bool":{"must":[{"term":{"process.parent.entity_id":"ZBvRmh7FGyOMXs44OIsEag"}},{"term":{"event.action":"exec"}}]}},"_source":["process.command_line"],"sort":[{"@timestamp":"asc"}]}'
# find /home -name *creds*   <- first command
# ls -la /temp
# ls -la /dev/shm
# mkdir /tmp/creds           <- directory created in /tmp
# cat /home/ubuntu/Stuff/message.txt
```

The first command executed by the script is **find /home -name *creds*** and the directory it creates in `/tmp` is **creds**. This is exactly the parent-child pivot an analyst does to reconstruct an adversary's actions from telemetry alone.

## Task 5: generating and triaging alerts

Alerts are just documents in Elasticsearch, split across two stores: Defend's own endpoint alerts in `logs-endpoint.alerts-*`, and the SIEM detection-rule alerts in `.internal.alerts-security.alerts-*`. The room has you trigger two: an EICAR test file (blocked by the Prevent policy) and a `cat /etc/shadow` read.

![Elastic Security detection-rule alerts and the EICAR endpoint alert, read straight from the Elasticsearch alert indices](/img/thm-elasticdefend/02-alerts-api.png)

For the EICAR malware prevention alert, the `event.risk_score` is **73** and the `event.code` is **malicious_file**. For the shadow-file read, the SIEM rule "Potential Shadow File Read via Command Line Utilities" fires with a `kibana.alert.risk_score` of **47**, and its threat mapping lists Privilege Escalation then Credential Access, so the first MITRE ATT&CK tactic is **Privilege Escalation**. The queries:

```bash
# EICAR endpoint alert
q 'logs-endpoint.alerts-*' '{"query":{"match":{"file.name":"eicar.txt"}},"_source":["event.code","event.risk_score"]}'
# SIEM alerts: name, risk score, ordered tactic names
q '.internal.alerts-security.alerts-*' '{"_source":false,"fields":["kibana.alert.rule.name","kibana.alert.risk_score","kibana.alert.rule.threat.tactic.name"]}'
```

## Task 6: detection rules and the persistence attack

The last task runs `persist.sh`, which stages a reverse-shell payload and installs a cron job for persistence. Reading the script gives most of the answers straight away, and the process telemetry confirms them:

![The persist.sh script that stages a reverse shell in /opt and installs a cron persistence job](/img/thm-elasticdefend/01-persist-attack.png)

The "Cron Job Created or Modified" alert maps to **3** MITRE tactics (Persistence, Privilege Escalation, Execution). The `printf` child process that writes the payload has a `process.executable` of **/usr/bin/printf**. The payload itself is a `nc -e /bin/bash` reverse shell to **10.10.10.100 4444**. And the remaining `chmod` sets permissions on `/etc/cron.d/system-update`, so the cron job name is **system-update**.

## Solving from the API

Working the room this way is not a shortcut around the learning: the concepts (Prevent vs Detect, the three telemetry categories, `process.entity_id` correlation, the two alert stores, MITRE mappings) are exactly what you use whether you click through Kibana or query the API. But when a question wants a precise field value like a risk score, a `process.executable`, or an ordered tactic list, hitting the index directly is both faster and unambiguous. It is also the same instinct that makes a good analyst: the dashboard is a rendering of the data, and the data is the source of truth.

## Every answer

| Task | Question | Answer |
|---|---|---|
| 2 | Elastic Defend integration version | `9.2.0` |
| 2 | Default Malware protection level | `Prevent` |
| 3 | Full `process.name` for the Python process | `python3.12` |
| 3 | Top `network.type` value | `ipv4` |
| 4 | `process.parent.executable` for discovery.sh | `/usr/bin/bash` |
| 4 | First command executed by the script | `find /home -name *creds*` |
| 4 | Directory created in `/tmp` | `creds` |
| 5 | EICAR alert `event.risk_score` | `73` |
| 5 | EICAR alert `event.code` | `malicious_file` |
| 5 | Risk score of the `/etc/shadow` read alert | `47` |
| 5 | First MITRE tactic for the shadow alert | `Privilege Escalation` |
| 6 | MITRE tactics on the Cron Job alert | `3` |
| 6 | `printf` `process.executable` | `/usr/bin/printf` |
| 6 | Reverse shell IP and port | `10.10.10.100 4444` |
| 6 | Cron job whose permissions were set | `system-update` |

## Wrap-up

Using Elastic Defend is a strong, practical room. It builds the EDR half of the picture that the SOC Lab room left off: telemetry collection, prevention, alerting, and, most usefully, the `process.entity_id` pivot that turns a pile of process events into a readable attack chain. The three staged alerts, a blocked EICAR file, a shadow-file read, and a cron persistence attack, are small but realistic, and each one maps cleanly onto MITRE tactics you would triage for real. The lesson to carry forward is the same one the room quietly teaches: telemetry tells you what happened, alerts tell you what needs attention, and the answer is always in the data if you know which index to ask.
