---
title: "TryHackMe Re-Testing: Verify Fixes, Catch Patches"
date: 2026-10-10T16:26:00+05:30
lastmod: 2026-10-10T16:26:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-retest/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - Jr Penetration Tester
  - Pentesting Methodologies and Reporting
  - Penetration Testing
  - Re-Testing
  - SQL Injection
  - Burp Suite
  - Remediation
  - Pentest Reporting

draft: false
description: "Walkthrough of TryHackMe Re-Testing: re-test vs reassessment, pass/fail/risk-accepted outcomes, variant SQLi payloads, incomplete patches, and the re-test report."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|Re-Testing |![Re-Testing room icon](https://cdn-images.tryhackme.com/room-icons/691e303c8bb7e99b93a58132-1778754503304)|

Re-Testing closes the loop on the Pentesting Methodologies and Reporting module in the Jr Penetration Tester path. After [Planning and Scoping](/post/thm-room-planningandscoping/) set the boundaries and [Writing Pentest Reports](/post/thm-room-writingpentestreports/) delivered the findings, this room answers the question every client asks next: are we actually fixed? The opener cites research from Netlas that 15.5% of security patches are unreliable in some way, so roughly one in six findings a client believes is closed will not survive a competent re-test.

This room has a lab machine for the hands-on part (Task 6), a vulnerable login form you test with Burp Suite. On my setup a corporate VPN held the route and the TryHackMe VPN was not connected, so the lab target was not reachable from my Mac. I solved the two lab answers from the room's own walkthrough screenshots and the TryHackMe answer checker, and I have flagged that honestly below rather than claiming a Burp session I did not run.

## Task 1: Introduction

The scenario frames re-testing as a verification discipline, distinct from the original discovery test. The question just confirms the lab machine started, so it is completed with a click after starting the machine.

## Task 2: Re-Testing vs. Full Reassessment

A re-test verifies specific fixes from a closed engagement. A full reassessment is a fresh test of the whole system, appropriate after major change. The first question gives a client who rebuilt their entire e-commerce platform after remediation.

A rebuild of the whole platform means the old findings are no longer the right scope, so they need a **Full Reassessment**. The second question asks which document governs whether re-testing was included and should be reviewed before the original assessment ends.

The task explains that the original authorization, scope, and Statement of Work all belong to a closed engagement, so the answer is the **SOW**. A re-test needs its own pre-engagement documentation even when the same team performs it.

## Task 3: Scoping the Re-Test Engagement

Re-testing has its own scoping concerns, including the window the client gets to implement fixes. The first question asks for the term for the period between report delivery and the re-test.

That is the **Remediation Window**. The second question describes a client who signs a formal document stating they will not fix a medium-severity finding due to business constraints.

That outcome is recorded as **Risk Accepted**, a legitimate business decision you document accurately rather than mark as fixed. The task also distinguishes this from a compensating control, where the client reduces risk with an alternative measure instead of simply accepting it.

## Task 4: Pass, Fail, and Everything Between

Re-test outcomes are not binary. The question gives the central scenario: the original SQLi payload `' OR '1'='1` is now blocked and returns a generic error, but a variant payload `' OR 1=1--` still returns all user records.

The outcome is **Fail**. The specific payload from the report being blocked does not matter; the root cause (string concatenation in the SQL query) is still present, so the finding fails re-testing.

## Task 5: Common Pitfalls in Re-Testing

This task catalogs the ways re-tests go wrong. The first question asks which earlier CVE an incomplete patch produced: CVE-2023-43208 arose directly from an incomplete patch for which CVE?

The task documents that **CVE-2023-37679** was the original Mirth Connect unauthenticated RCE, and its incomplete denylist fix in version 4.4.0 was bypassable, with the complete fix only arriving in 4.4.1. The second question asks which pitfall covers vendor patches that are themselves incomplete.

That is **Incomplete Vendor Patches** (the room's Pitfall 4). A re-tester who only checks "is version 4.4.0 installed?" would record a false pass while the bypass stays exploitable.

{{< ad >}}

## Task 6: Verifying the SQLi Fix

This is the hands-on task against the lab's login form at `http://MACHINE_IP/login`, driven through Burp Suite Repeater. You submit the original payload, confirm it is blocked, then try variants until one succeeds. The room's walkthrough shows the responses, which is how I confirmed the two values my offline setup could not fetch live.

The first question asks the HTTP response code when the original payload `' OR '1'='1` is submitted. The blocked payload returns the login page re-rendered with an "Invalid input detected" error message, which is an application-level response, not a WAF block, so the code is **200**.

```text
  # original payload: blocked at the denylist, app renders an error page
  username=' OR '1'='1   ->  HTTP 200, body shows "Invalid input detected"
  # variant payload: bypasses the denylist, same vulnerable query executes
  username=' OR 1=1--    ->  redirect to /dashboard, all records returned
```

The second question asks the URL path the application redirects to when the variant payload succeeds. On a successful bypass it redirects to **/dashboard**. The third question asks the overall re-test result for Finding F-01.

Because the variant still works, the finding is a **Fail**. The denylist changed what the login form returns, but the root cause remains fully exploitable, which is exactly the "symptom patch" pattern the room is teaching.

## Task 7: Evidence Collection and the Re-Test Report

The re-test report centers on a findings status table with columns for Finding ID, Title, Original Severity, Remediation Type, Re-Test Result, and Notes. The question asks which column captures the specific fix the developer applied, for example "Blocklist added for specific payload".

That is the **Notes** column, which records what the developer changed plus a brief outcome observation for failed findings.

## Task 8: Conclusion

The closing task frames re-testing as a comparison discipline, a shift from exploration to verification, and notes it is often a junior pentester's first solo engagement responsibility. No answer is needed, so the task is marked complete.

![Re-Testing room completed 100 percent with all eight tasks solved](/img/thm-retest/02-room-complete.png)

## Takeaways

Two things worth carrying out of this room:

- **A blocked payload is not a fixed vulnerability.** The whole lesson of the SQLi re-test is that the original proof-of-concept getting blocked proves only that one string is on a denylist. The fix passes only if the root cause is gone, which here means parameterized queries, not string concatenation. Always test variant payloads before recording a pass, because a symptom patch leaves the finding fully exploitable.
- **Re-test outcomes are a spectrum, and the report must capture it.** Pass, Fail, Risk Accepted, and compensating-control outcomes each mean something different to an auditor. Record the remediation type and the specific change in the Notes column so the status table is an honest, independently verifiable record, not just a closed ticket.

Room solved 100%: 8 tasks, 11 answers.
