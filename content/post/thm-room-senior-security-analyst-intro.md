---
title: "TryHackMe Senior Security Analyst Intro: The L2 Role"
date: 2026-08-13T20:14:00+05:30
lastmod: 2026-08-13T20:18:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-seniorsecanalyst/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - SOC Level 2
  - Blue Team
  - SIEM
  - Career

draft: false
description: "Walkthrough of TryHackMe Senior Security Analyst Intro: what a SOC Level 2 analyst actually does, the L1 to L2 mindset shift, and the SIEM timeline challenge flag."
---

## Senior Security Analyst Intro

This is the opening room of the SOC Level 2 track, and it is almost entirely a reading room with one interactive challenge at the end. It sets expectations for the promotion from Level 1: what changes in the day-to-day, which skills matter, and, more than anything, how the mindset shifts. The single sentence worth carrying out of the room is that being a senior is not just a technical step up, it is taking ownership of the whole security posture rather than closing tickets. The flag at the end says it plainly: the L2 role is `much_more_than_alert_triage`.

![Senior Security Analyst Intro room completed on TryHackMe, six tasks done and thirty-two points earned](/img/thm-seniorsecanalyst/03-room-complete.png)

## Task 2: new role, new duties

Level 2 is a natural progression from Level 1, a middle or senior technical role that investigates escalated alerts and responds to threats. Unless the company has a dedicated L3 and DFIR team, an L2 quietly absorbs a lot of senior duties: building detection rules, running threat hunts, cleaning malware and rotating credentials, and sometimes leading incident response outright.

The question asks whether you should improve technical skills, soft skills, or both to reach L2. The answer is **Both**. The room is explicit that the biggest gap between L1 and L2 is not technical knowledge but soft skills: responsibility, initiative, mentoring juniors, and communicating clearly across teams.

## Task 3: the fun part

{{< ad >}}

Beyond the salary bump, the L2 role broadens your worldview and stops you becoming a narrow specialist. The room groups the upside into three buckets, which is exactly what the thumbnail above tries to capture:

- **Incident Handling**: the interesting cases that were too complex for L1, such as infostealers that slipped past prevention, supply chain attacks, insider threats, and Active Directory intrusions. You move past SIEM-only triage into on-host, cloud, and network investigation.
- **Engineering Tasks**: most companies merge L2 duties with detection engineering, SIEM maintenance, and automation. Simulating an attack and then writing the rule that catches it is a normal part of the job.
- **General Security Tasks**: working with IT on patching and policy, helping compliance, analysing pentest results, and discovering how the rest of the business actually runs.

The question here is whether exploring new security areas helps you grow, and the room wants the affirmative from its own Yea/Nay prompt: **Yea**.

## Task 4: the mindset shift

This is the conceptual core of the room. Two scenarios illustrate the difference between a junior and a senior reaction.

The first is a **sense of responsibility**. If the servers have produced no alerts for two weeks, the junior sees less work; the senior sees a broken logging pipeline and raises the alarm. The rule the room states is to never ignore a security concern, whether or not it is your fault.

The second is the **attacker mindset**. An alert fires for a PowerShell `whoami` spawned by the IIS web server, and nothing follows. The junior calls it expected web activity; the senior reads it as a web shell being tested and assumes malicious commands are coming. That is the answer to the question about which mindset helps you see and predict how incidents unfold: the **Attacker Mindset**. Thinking like an attacker lets you complete the puzzle, working out what happened before the alert and what is coming next.

## Task 5: a day as Level 2 (the challenge)

The interactive task drops you into a mock SIEM titled *A Day In the Life of a Senior Security Analyst*. The brief: an EDR alert flags malware on `LPT-0152`, a contractor's corporate laptop, and rather than stopping at the alert you build an event timeline to find the root cause of the beaconing.

![The mock SIEM welcome screen for the Senior Security Analyst challenge, briefing the LPT-0152 malware alert](/img/thm-seniorsecanalyst/02-welcome.png)

Running the pre-filled process-creation search (`index=windows host=LPT-0152 EventCode=1`) lays the whole chain out in order. Read bottom to top and the story is obvious:

![SIEM search results for LPT-0152 showing the process chain: Edge downloads ReleaseNotes.pdf.exe, which spawns loader.exe, which launches rundll32 with beacon.dll](/img/thm-seniorsecanalyst/01-siem-timeline.png)

- **17:33** `j.miller` opens Microsoft Edge from Explorer, normal browsing.
- **17:40** Edge writes and runs `ReleaseNotes.pdf.exe` out of the Downloads folder. That double extension is the whole tell: it is an executable dressed up as a PDF.
- **19:58** the fake PDF spawns `loader.exe` from AppData\Roaming (highlighted red as the pivot event).
- **19:59** `loader.exe` launches `rundll32.exe` against `C:\Windows\Temp\beacon.dll,Start`, which is the actual C2 beacon.
- **19:50** a `taskhostw.exe` scheduled-task GUID shows the persistence that keeps the beacon alive.

The point the challenge is making is that the alert only told you about the beacon, but the timeline shows the double-extension download that started it, so the detection engineering step is to write a rule for executables with a double extension landing in Downloads. Work through the guided steps (SIEM Search, SIEM Rules, Threat Reports) and the app hands you the flag:

```
THM{much_more_than_alert_triage}
```

Worth noting for anyone building these labs: the static app is a single-page bundle served from `static-labs.tryhackme.cloud`, and the flag ships inside the JavaScript as a Base64 string. Pulling the bundle and decoding it gives the same answer without playing through, which is a good reminder that a client-side "flag reveal" is never a secret:

```bash
curl -s https://static-labs.tryhackme.cloud/apps/senior-security-analyst-intro/assets/index-*.js \
  | grep -oE '"[A-Za-z0-9+/]{24,}={0,2}"' | tr -d '"' \
  | while read s; do echo "$s" | base64 -d 2>/dev/null | grep -q '^THM{' && echo "$s" | base64 -d; done
# THM{much_more_than_alert_triage}
```

## Every answer

| Task | Question | Answer |
|---|---|---|
| 2 | Improve tech, soft, or both skills to become L2? | `Both` |
| 3 | Does exploring new security areas help you grow? (Yea/Nay) | `Yea` |
| 4 | Mindset that helps you see and predict how incidents unfold | `Attacker Mindset` |
| 5 | Flag from the challenge | `THM{much_more_than_alert_triage}` |

## Wrap-up

Senior Security Analyst Intro is a scene-setter rather than a technical grind, but it frames the rest of the SOC Level 2 path well. The through-line is ownership: a senior does not stop at the alert, does not shrug off missing logs, and does not assume a stray `whoami` is harmless. The challenge makes that concrete by rewarding the analyst who builds the full timeline instead of triaging the beacon in isolation, and the flag drives it home. Next in the path the triage gets a lot deeper, but the mindset from this room, assume breach and complete the attack picture, is the part that carries all the way through.
