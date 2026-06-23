---
title: TryHackMe Room Cloud Computing Fundamentals
date: 2026-06-23T12:00:00+05:30
lastmod: 2026-06-23T12:00:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - rooms
  - thm
  - Cloud Computing
  - Pre Security

draft: false
description: "A beginner-friendly walkthrough of the TryHackMe Cloud Computing Fundamentals room — what the cloud is, deployment types (public, private, hybrid), service models (IaaS, PaaS, SaaS), and every task answer in plain English."
---
## Cloud Computing Fundamentals

This room is part of the **Pre Security** path — about 30 minutes, mostly reading plus one short hands-on cloud-console exercise (no hacking). It explains, in plain language, what "the cloud" actually is, why companies use it, and the words you will keep hearing later, like *public cloud*, *IaaS*, and *EC2*.

Think of a small app you built on your laptop. It works, but only you can use it, and if a lot of people show up, your laptop cannot keep up. The cloud is the fix for exactly this kind of problem. Let's walk through the room task by task.

## Task 01: Introduction

The first task just sets the scene: the cloud lets you use computing power over the internet instead of one computer in one place. There is nothing to type here — read it and click **Complete**.

## Task 02: Cloud Computing Overview

This is the main reading task. Here are all the ideas, in simple terms.

### How servers grew into "the cloud"

Cloud computing did not appear overnight. It is the result of years of small steps:

1. **Physical servers** — one company, one room full of machines.
2. **Virtualization** — many virtual servers running on a single physical machine.
3. **Automation & remote management** — controlling servers over the internet.
4. **Cloud computing** — renting computing power online, whenever you need it.
5. **Modern / serverless** — providers like AWS, Azure, and Google Cloud handle the rest.

### Why people love the cloud (benefits)

- **Scalability** — grow or shrink your app whenever the need changes.
- **On-demand self-service** — create servers and storage instantly, no waiting for hardware.
- **Pay only for what you use** — no big upfront cost.
- **Security** — the provider protects the underlying hardware.
- **High availability** — your app keeps running even if one part fails.
- **Global access** — anyone, anywhere can reach your app.

### Ways to *deploy* a cloud (deployment types)

- **Public Cloud** — shared, cheap, and easy to scale. Used by startups and most websites. This is the **most common** one.
- **Private Cloud** — built for just one company, for more control and privacy. Used by banks, hospitals, and governments.
- **Hybrid Cloud** — a mix of both: keep sensitive data private, but scale publicly when things get busy (e.g. online stores on Black Friday).

### Ways to *use* a cloud (service models)

A simple way to remember these is to compare them to renting a place to live:

- **IaaS (Infrastructure as a Service)** — you rent the basic parts (servers, storage, network) and manage the operating system and your app yourself. *Like renting an empty apartment.*
- **PaaS (Platform as a Service)** — the provider manages the servers **and** the operating system; you only build and run your app. *Like a furnished apartment.*
- **SaaS (Software as a Service)** — you just use a finished app in your browser, like Gmail or Zoom. *Like a hotel room — everything is done for you.*

### The big cloud providers

**AWS (Amazon Web Services)** is the market leader. Other well-known ones are **Microsoft Azure**, **Google Cloud Platform (GCP)**, **Alibaba Cloud**, **IBM Cloud**, and **Oracle Cloud**. Real examples: **Netflix**, **Spotify**, and **Instagram** all run on the cloud so they can serve millions of people at the same time.

{{< ad >}}

### Task 2 — Questions and Answers

**What is the characteristic of cloud environments that enables you to handle an unexpected increase in access to your application?**

> `Scalability`

Scalability lets your app grow the moment more users arrive, so it does not crash under sudden traffic.

**What is the most common type of cloud deployment used?**

> `Public Cloud`

The public cloud is cheap, easy to scale, and needs no hardware management — so it fits nearly every use case.

**Suppose you want to deploy an application to the internet, focusing only on application development and leaving infrastructure to others. What type of cloud service is the best?**

> `PaaS`

With PaaS the provider runs the servers and operating system for you, so you only have to worry about your code.

## Task 03: Deploying a Cloud Instance

This is the hands-on part. Click **View Site** to open the *TryHackMe Cloud Console* — a safe, simulated version of a cloud platform like AWS. You don't need to memorise buttons; the goal is just to *see* how easily cloud machines (and their costs) can be created and changed.

Two words first:

- **EC2** is a virtual computer in the cloud — it has a CPU and RAM and runs apps, just like a real machine. Adding an EC2 instance = adding a computer to your environment.
- **Instance Type** (like `t3.micro` or `m5.large`) describes how powerful that computer is. Bigger = more power = higher cost.

### What to do in the console

1. Pick a **Region** (top-right) — just a geographical location for your resources.
2. In **Create Lab Machine**, create your app machine — Name: `application-interface`, Type: `t3.micro`, Status: `running`.
3. Create two study machines for practising — `study-machine-1` and `study-machine-2`, both `m5.large`, both running.
4. Open **Billing** to see the cost per machine and the total.
5. Stop both study machines, then check Billing again — the cost drops, because **stopped machines cost nothing**.

The console uses these simple prices (credits per month):

| Instance type | Cost / month |
|---|---|
| t3.micro | 10 |
| t3.small | 18 |
| m5.large | 70 |
| any **stopped** VM | 0 |

The environment starts with two machines already running — `web-1` and `db-1` (both `t3.micro`). So once you add your three, the full environment is `web-1` + `db-1` + `application-interface` (3 × t3.micro = 30) plus `study-machine-1` + `study-machine-2` (2 × m5.large = 140) = **170 credits/month** when everything runs.

### Task 3 — Questions and Answers

**What is the total cost of credits of the entire environment if study-machine-1 and study-machine-2 are stopped?**

> `30`

The two `m5.large` study machines stop (0 credits each), leaving the three `t3.micro` machines running: 10 + 10 + 10 = **30**.

**How many credits does an m5.large EC2 instance cost per month?**

> `70`

**What is the total cost of credits if only the new instances we created are running?**

> `150`

Only the three you created run: `application-interface` (10) + `study-machine-1` (70) + `study-machine-2` (70) = **150**.

**What would be the total running cost of the entire environment you created if you add a third t3a.small study machine?**

> `188`

The full environment running is 170, and a `t3a.small` (same price as t3.small, 18 credits) adds 18: 170 + 18 = **188**.

> 💡 Lesson: cloud billing is *pay-for-what-you-run*. Stopping machines you don't need is the easiest way to cut your bill — exactly what the exercise shows.

## Task 04: Conclusion

A quick recap of the words you learned in this room:

| Term | In plain English |
|---|---|
| **Public Cloud** | Shared cloud services you use over the internet. |
| **Private Cloud** | A cloud built for just one company. |
| **Hybrid Cloud** | A mix of public and private that work together. |
| **IaaS** | Rent the basic computer parts (servers, storage). |
| **PaaS** | A ready-to-use place to build and run apps. |
| **SaaS** | Finished software you use online (Gmail, Zoom). |
| **EC2** | Amazon's cloud computers you can create and resize anytime. |

And the key benefits again: **scalability, on-demand self-service, pay only for what you use, security, high availability, and global access.**

**I'm ready for the next module!**

> `No answer needed`

## Wrap-up

That's the whole room. The cloud is really just *someone else's computers that you rent over the internet* — but that one simple idea is what lets small teams run apps used by millions. Next in the Pre Security path is **Operating Systems**, which explains how those rented machines actually run your software behind the scenes.

Happy learning! 🚀
