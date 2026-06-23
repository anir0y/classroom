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

This room is part of the **Pre Security** path, and it is a *reading* room — about 30 minutes, no hacking. It explains, in plain language, what "the cloud" actually is, why companies use it, and the words you will keep hearing later, like *public cloud*, *IaaS*, and *EC2*.

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

This task is the hands-on part. TryHackMe gives you a simulated cloud environment so you can see the ideas in action and "deploy" a cloud instance — an **EC2**-style virtual machine (EC2 is Amazon's name for a cloud computer you can create, use, and remove whenever you need it). Just follow the on-screen steps in the room to launch the instance, then continue to the conclusion.

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
