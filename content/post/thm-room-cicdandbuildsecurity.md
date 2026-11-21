---
title: "TryHackMe CI/CD and Build Security: Jenkins RCE to PROD Pivot"
date: 2026-11-21T14:20:00+05:30
lastmod: 2026-11-21T14:20:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-cicdbuild/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - DevSecOps
  - Security of the Pipeline
  - CI/CD
  - GitLab
  - Jenkins
  - GitLab Runner
  - pipeline security
  - RCE
  - lateral movement

draft: false
description: "TryHackMe CI/CD and Build Security walkthrough: Jenkins jenkins:jenkins script console RCE, GitLab CI job poisoning, and a shared runner key pivot from DEV to PROD."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|CI/CD and Build Security |![CI/CD and Build Security room icon](https://cdn-images.tryhackme.com/room-icons/49688427a6da353a664c0059639ea881.png)|

CI/CD and Build Security is the medium-rated network room in the DevSecOps path's Security of the Pipeline module, the same module as my [Source Code Security](/post/thm-room-sourcecodesecurity/) and [Intro to Pipeline Automation](/post/thm-room-introtopipelineautomation/) writeups. Where those rooms looked at one box in the pipeline diagram, this one hands you the whole network: a GitLab server, a Jenkins server, a cluster of build agents and runners, and DEV and PROD environments, all themed around the Alien USCSS Nostromo. You report every compromise to the MU-TH-UR 6000 mainframe ("Mother") to claim five flags.

This is a VPN network room, not a single box. I ran it through the AttackBox, then dropped an SSH key into the AttackBox so I could drive the whole engagement from the Mac terminal and script the repetitive parts (the GitLab API, the Jenkins script console, and the Mother proof flow with pexpect). Every target IP below is reachable only from inside the room network.

## Setup: the network and Mother

The network diagram gives you the hosts: GitLab (`gitlab.tryhackme.loc`), Jenkins (`jenkins.tryhackme.loc:8080`), build agents, and the DEV and PROD environments. A scan of the target subnet from the AttackBox finds them:

```text
  # 10.200.60.0/24
  10.200.60.150  GitLab (22, 80)
  10.200.60.160  Jenkins (8080)
  10.200.60.171  JAgent (Jenkins build agent)
  10.200.60.201  GRunner01   10.200.60.202 GRunner02   10.200.60.203 GRunner03
  10.200.60.220  DEV         10.200.60.230 PROD
  10.200.60.250  Mother (SSH)
```

Mother is an SSH menu app (`mother:motherknowsbest`). You register once with your THM username, and it hands you a set of challenge credentials to use across the network. The proof mechanism is the key to the whole room: for each flag you pick the compromise type, name the host you took, and Mother gives you a per-attempt UUID. You write that UUID to `/flag/<username>.txt` on the compromised host, and Mother SSHes in to read it back before awarding the flag. I drove that flow with pexpect so I could capture the UUID, write it on the target, and confirm in one pass.

## Task 4: your own pipeline and the Timekeep flag

GitLab allows open registration, so I registered an account and enumerated the projects, all owned by the `ash` user: `mobile-app`, `basic-build`, `Merge-Test` and `approval-test`. The build agent GitLab uses is the **Gitlab Runner**.

The `basic-build` repo holds the Timekeep app (a small PHP site). Its README states the app ships with default credentials `admin:admin`, and the flag is served straight out of `timekeep.php` once you authenticate:

```text
  curl http://gitlab.tryhackme.loc/api/v4/projects/3/repository/files/website_src%2Ftimekeep.php/raw?ref=main
  # <p class='warning'>Your flag value is: THM{Welcome.to.CICD.Pipelines}
```

**Timekeep flag: `THM{Welcome.to.CICD.Pipelines}`**

## Task 5: build source secrets and the mobile API key

Securing the build source is about the two issues of **Unauthorised Tampering** and unauthorised disclosure, with `.gitignore` controlling what is excluded from version control and protected **Branches** stopping direct pushes. The practical finding is a hard-coded key any GitLab user can read. A blob search across the `mobile-app` project turns it up in the Dockerfile:

```text
  curl -s 'http://gitlab.tryhackme.loc/api/v4/projects/1/search?scope=blobs&search=API_KEY'
  # Dockerfile :: ENV ANDROID_API_KEY "THM{You.Found.The.API.Key}"
```

**Mobile app API key: `THM{You.Found.The.API.Key}`**

{{< ad >}}

## Securing the build process: Flag 1 (JAgent)

The build process is remote code execution as a feature. Store artefacts in a **Secure Registry**, use **Secret Management** for sensitive data, and watch for **Dependency Confusion** style injection. The room's own toxic combination is an on-merge Jenkins build on `Merge-Test`: a merge request builds the attacker's `Jenkinsfile` on a Jenkins agent.

Jenkins has two nodes, the built-in node and `Agent_One`. Rather than catch a reverse shell, I used the Jenkins access I was about to get (next section) to run a command on the agent directly and identify it as the JAgent:

```text
  # via the Jenkins script console, run on Agent_One
  HOST=ip-10-200-60-171   user=ubuntu   /flag is world-writable
```

So the build-process compromise lands on the **JAgent** (`ip-10-200-60-171`). I started Mother's Build Process attempt, took the UUID, wrote it to `/flag/anir0y.txt` on the agent, and verified.

**Flag 1 (Build Process): `THM{...(redacted)}`** (a per-attempt UUID, unique to each run)

## Task 6: the build server, Flag 2 (Jenkins)

Securing the build server comes down to restricting access, using a **VPN** for secure remote access, and adding **Token-Based Authentication** as an extra layer for the agents. The room's lesson is the oldest one in the book: `jenkins:jenkins`. Those credentials log straight in, and Jenkins exposes a Groovy script console, which is unauthenticated RCE once you are in:

```text
  # authenticate, grab a crumb, then run Groovy
  curl -b jc.txt -H "$CRUMB" http://jenkins.tryhackme.loc:8080/scriptText \
    --data-urlencode 'script=println "hostname".execute().text; println "id".execute().text'
  # ip-10-200-60-160
  # uid=115(jenkins) gid=123(jenkins)
```

That is code execution as the `jenkins` user on the Jenkins server (`ip-10-200-60-160`). Jenkins also lets you reach its agents: `hudson.util.RemotingDiagnostics.executeGroovy(...)` against `Agent_One`'s channel runs Groovy on the JAgent, which is how I wrote the Flag 1 proof earlier. For Flag 2 I named the **Jenkins** host to Mother and wrote the UUID to its `/flag`.

**Flag 2 (Build Server): `THM{...(redacted)}`**

## Task 7: the build pipeline, Flag 3 (GRunner01)

From here the room gives you the lower-privileged developer `anatacker`. Ash protected the main branch of `approval-test` so developers can only raise merge requests, but he made two mistakes: the merge approval is optional, and the CI job has no branch restriction. Any branch a developer pushes runs the pipeline on the attached GitLab runner.

So I pushed a feature branch whose `.gitlab-ci.yml` just runs `hostname`, then read the job trace through the API:

```text
  git push origin anir0y-rec       # as anatacker
  # job trace:
  RUNNERHOST=ip-10-200-60-201
  uid=1001(gitlab-runner)
```

The runner is **GRunner01** (`ip-10-200-60-201`). The control Ash should have used is to raise merges as **Merge Requests** with enforced review and to **Limit Runner Access** by tagging runners. With code execution on the runner, I pushed a second job that writes the Mother UUID to `/flag/anir0y.txt` and verified.

**Flag 3 (Build Pipeline): `THM{...(redacted)}`**

## Task 8: the build environments, Flags 4 and 5 (DEV to PROD)

The last repo, `ash/environments`, has a DEV branch with its own runner. The key lesson is **Isolate Environments**: use separate runners for DEV and PROD. Ash did not. A recon job on the environments runner shows it is `GRunner02` (`ip-10-200-60-202`) and, crucially, that it holds a deploy key with SSH access to both environments:

```text
  # from a DEV pipeline job on GRunner02
  ls ~/.ssh    # id_rsa present
  ssh -i ~/.ssh/id_rsa ubuntu@10.200.60.220 'hostname'   # LOGIN_OK ip-10-200-60-220  (DEV)
  ssh -i ~/.ssh/id_rsa ubuntu@10.200.60.230 'hostname'   # LOGIN_OK ip-10-200-60-230  (PROD)
```

This is the "one build agent to rule them all" misconfiguration. The shared runner can deploy to DEV and PROD, so one foothold on it owns both. From a DEV pipeline I SSHed to the DEV host and wrote the Flag 4 proof, then to the PROD host and wrote the Flag 5 proof.

**Flag 4 (DEV Environment): `THM{...(redacted)}`**
**Flag 5 (PROD Environment): `THM{...(redacted)}`**

## Task 9: build secrets and the PROD key

Are environment variables enough to protect secrets? **Nay.** The PROD deploy job references an `API_KEY` variable. Because the variable is not scoped to protected branches only, a DEV pipeline can simply echo it:

```text
  # in the DEV job script
  echo "APIKEY=${API_KEY}"
  # APIKEY=THM{Secrets.are.meant.to.be.kept.Secret}
```

**PROD API_KEY: `THM{Secrets.are.meant.to.be.kept.Secret}`**

## Two takeaways

First, a CI runner is a shell with credentials, and the branch that can start a job decides who gets that shell. Two of the five flags here came from the same root cause: a pipeline that builds any branch or any merge request, run by a runner that has more access than the job needs. On a real target, the question is never "is the main branch protected" but "what is the full set of refs and events that can start a build, and what can the agent that runs it reach". Tag runners, scope them per environment, and never let a DEV job touch a PROD deploy key or a PROD secret.

Second, the oldest findings still win. `jenkins:jenkins` into a Groovy script console was a straight line to RCE on the build server and, through its agents, to the rest of the pipeline. Default credentials, a world-writable directory, and an unscoped CI variable are not exotic; they are what you actually find. Secure the boring things first, because that is where the compromise starts, the same lesson as the hard-coded credentials in the [Source Code Security](/post/thm-room-sourcecodesecurity/) room.

A note on the flags: Flags 1 to 5 are per-attempt UUIDs that Mother generates for each player and verifies by reading a file off the host you compromised, so their literal values are meaningless to anyone else and are redacted here. The descriptive flags (Timekeep, the mobile API key, and the PROD secret) are fixed across the room and shown in full, since they carry the lesson rather than a secret.

Room solved 100%: 11 tasks, 29 answers.
