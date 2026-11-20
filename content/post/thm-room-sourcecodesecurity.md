---
title: "TryHackMe Source Code Security: Secrets in Git and GitLab CI"
date: 2026-11-20T20:23:00+05:30
lastmod: 2026-11-20T20:23:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-source-code-security/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - DevSecOps
  - Security of the Pipeline
  - Git
  - GitLab
  - secrets management
  - credential hygiene
  - CI/CD

draft: false
description: "TryHackMe Source Code Security walkthrough: hard-coded secrets in Git history, GitLab CI/CD variables via the API, and moving credentials to os.Getenv."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|Source Code Security |![Source Code Security room icon](https://cdn-images.tryhackme.com/room-icons/9840c90efb47614678e120343c0432c8.png)|

Source Code Security is the DevSecOps path's medium-rated walkthrough on credential hygiene in version control, in the Security of the Pipeline module. It follows [Intro to Pipeline Automation](/post/thm-room-introtopipelineautomation/), where source control was one box in a diagram, and zooms in on it: Git's origin story, centralised versus distributed version control, GitHub and GitLab, why hard-coded credentials are a problem, and then a GitLab lab (the USCSS Nostromo, with an Alien theme) where you find what the developers left behind. If you are new to the path, my [SDLC](/post/thm-room-sdlc/) notes are the starting point.

Six of the eight tasks are reading comprehension. The lab is where the room earns its "medium" rating, and I solved it entirely from the Mac terminal against the GitLab API rather than clicking through the web UI.

## Task 1: introduction

No answer needed. The room tells you up front that it focuses on Git, with GitLab as the hosting platform for the rest of the DevSecOps path.

## Task 2: Git, BitKeeper and Linus

From 2002 the Linux kernel was developed on a proprietary distributed version control system, **BitKeeper**. In 2005 the relationship with BitKeeper's owner fell apart, the kernel lost access, and Linus Torvalds wrote his own replacement. Git was released in **2005**.

## Task 3: centralised versus distributed

Centralised systems such as Subversion have one repository, and commits are visible to everyone immediately. Distributed systems give every developer a full repository and push changes to a shared one. Git is **Distributed**.

## Task 4: cloud-hosted version control

GitHub was founded in **2007** and launched Actions in 2018. GitLab was founded in 2014 and ships CI/CD built in, using runners. The second question, where cloud-based version control systems store code, carries a "use a search engine" hint. My first answer, "In the cloud", fit the 12-character mask but was rejected. The accepted answer is **Repositories**. That was the only wrong submission in the room.

{{< ad >}}

## Task 5: insufficient credential hygiene

This task follows the OWASP CI/CD Top 10 item on credential hygiene. Its advice: use least privilege, avoid sharing credentials across contexts, prefer short-lived credentials, rotate, scan commits for secrets, keep secrets out of build logs and image layers. The fix it recommends for hard-coded secrets is **Environment Variables**. It then warns that environment variables do not make you safe on their own, so the answer to "free from compromise?" is **No**.

## Task 6: clone, branch, push

A Git refresher. Isolated lines of development are **Branches**. The repository you cloned from is **Origin**. The command that copies a remote repository is **Git clone**.

## Task 7: the USCSS Nostromo lab

The lab VM runs GitLab, with room credentials provided in the task. My Mac was on the TryHackMe VPN, so I reached it directly by IP with no AttackBox. GitLab took a few minutes to stop returning 502. Instead of the web UI, I used the room credentials to get a short-lived API token through GitLab's OAuth password grant, then searched for the project and cloned it:

```text
  curl -X POST http://<lab>/oauth/token -d 'grant_type=password&username=<room user>&password=<room pass>'
  curl -H "Authorization: Bearer $TOK" 'http://<lab>/api/v4/projects?search=nostromo'
  # 2 gitlab-instance-dc881f3b/uscss-nostromo
  git clone http://oauth2:$TOK@<lab>/gitlab-instance-dc881f3b/uscss-nostromo.git
```

`nostromo.go` on master sets `username` and `password` as plain string literals in `init()`, which is the problem the task is built around. The repo also has about 30 branches with generated filler names and commit messages, which is realistic noise. Listing every commit on every branch and filtering out the filler finds one commit that does not fit:

```text
  git log --all --format='%h %D %s' | grep -i thm
  # 7eeb1a6 origin/DEVSEC-113-Secure-Nostromo-API THM-...(redacted)
```

The flag is that commit's message, on the `DEVSEC-113-Secure-Nostromo-API` branch, which the master history also passes through. The other answer is the package `os.Getenv` lives in: **os**.

Then the intended exercise: create a branch, import `os`, replace the literals with `os.Getenv("GITLAB_USERNAME")` and `os.Getenv("GITLAB_PASSWORD")`, then commit and push the branch. As the room says, don't merge it. The push printed GitLab's "create a merge request" link, which confirmed the branch arrived.

```text
  git checkout -b fix-credential-hygiene
  # nostromo.go
  +    "os"
  -    username = "admin"
  -    password = "p@ssw0rd"
  +    username = os.Getenv("GITLAB_USERNAME")
  +    password = os.Getenv("GITLAB_PASSWORD")
  git commit -a -m "Fixed credential hygiene by using environment variables"
  git push -u origin fix-credential-hygiene
  # remote: To create a merge request for fix-credential-hygiene, visit: ...
```

## Task 8: secret management, and where the secret actually lived

The task explains moving those values into GitLab's CI/CD variables (Settings, CI/CD, Variables, marked Protected), so pipelines can inject them. The two theory answers are **Secret Management** and the pipeline definition file, **.gitlab-ci.yml**. The repo's `.gitlab-ci.yml` only echoes "Hello!" and never runs on merge requests, which sets up the next room, Build System Security.

The hidden flag is in the place the task has just told you to store secrets. A user with enough project access (Maintainer) can read CI/CD variables through the API, and this variable is protected but not masked:

```text
  curl -H "Authorization: Bearer $TOK" http://<lab>/api/v4/projects/2/variables
  # [{"variable_type":"env_var","key":"THM_...(redacted)",
  #   "value":"This is Ripley, last survivor of the Nostromo, signing off",
  #   "protected":true,"masked":false,"environment_scope":"*"}]
```

The flag is the variable's **key**, not its value (the value is Ripley's sign-off line from the film). I have redacted it, along with the Task 7 flag, as in my other DevSecOps writeups.

## Two takeaways

First, a secret removed from the tip of a branch is still in the repository. The Nostromo flag lived in a commit message on a side branch, and the hard-coded credentials will stay in master's history even after the os.Getenv fix is merged. Real cleanup means rotating the credential, then rewriting history if you need to. Scan every ref with `git log --all`, not only the default branch.

Second, moving secrets into CI/CD variables changes who can read them; it does not make them secret. Protected only means they are injected into pipelines on protected branches. Anyone with Maintainer access can still list them through `/projects/:id/variables`, and an unmasked value will appear in any job log that echoes it. Treat CI variable access as privileged, mask everything, and prefer short-lived credentials from a real secrets manager.

Room solved 100%: 8 tasks, 16 answers.
