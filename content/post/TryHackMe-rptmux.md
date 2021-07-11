---
title: TryHackMe Tmux
date: 2021-07-11T13:50:48+05:30
lastmod: 2021-07-11T13:50:48+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
cover: /img/thm.gif # for tryhackMe

categories:
  - TryHackMe
tags:
  - tryhackme
  - rooms
  - thm
  - tmux

draft: false
description: TryHackMe Room tmux solved by Animesh Roy. this is a walkthough. read more...

---

## Overview

|Room Name| |
|---|---|
|tmux|[![tmux](https://i.imgur.com/GYktm26.png)](https://tryhackme.com/room/rptmux)|
|Dev| [@anir0y](https://anir0y.in)|

---

## [Task 1] Screens wishes it was cool

tmux, the terminal multiplexer, is easily one of the most used tools by the Linux community (and not just pentesters!). While not a malicious tool, tmux makes running simultaneous tasks throughout a pentest incredibly easy. In this primer room, we'll walk through the process of installing and using some of the most common key combinations used in tmux. (Note, the installation process in this is geared towards Kali/Ubuntu.)

![tmux](https://i.imgur.com/bL9Dn3U.png)

* Once tmux is installed, let's launch a new session. What command do we use to launch a new session without a custom name? `tmux`

* All tmux commands start with a keyboard button combination. What is the first key in this combination? `Control`

* How about the second key? Note, these keys must be pressed at the same time and released before pressing the next target key in the combination. `B`

* Lets go ahead and detach from our newly created tmux session. What key do we need to add to the combo in order to detach? `D`

* Well shoot, we've detached from our session. How do we list all of our sessions? `tmux ls`

* What did our session name default to when we created one without a set name? `0`

* Now that we've found the name of our session, how do we attach to it? `tmux a -t 0`

* Let's go ahead and make a new window in this session. What key do we add to the combo in order to do this? `c`

* Whew! Plenty of output to work with now! If you work with a relatively small terminal like me, this output might not all fit on screen at once. To fix that, let's enter 'copy mode'. What key do we add to the combo to enter copy mode? `[`

* Copy mode is very similar to 'less' and allows up to scroll up and down using the arrow keys. What if we want to go up to the very top? `g`

* How about the bottom? `G`

* What key do we press to exit 'copy mode'? `q`

* This window we're working in is nice and all but I think we need an upgrade. What key do we add to the combo to split the window vertically? `%`

* How about horizontally? `"`

* Say one of these newly minted panes becomes unresponsive or we're just done working in it, what key do we add to the combo to 'kill' the pane? `x`

* Now that's we've finished out work, what can we type to close the session? `exit`

* Last but now least, how do we spawn a named tmux session named 'neat'? `tmux new -s neat`
  
---

<!-- Google Ads -->

<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
<ins class="adsbygoogle"
     style="display:block; text-align:center;"
     data-ad-layout="in-article"
     data-ad-format="fluid"
     data-ad-client="ca-pub-3526678290068011"
     data-ad-slot="7160066188"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
<!-- END -->

<script data-name="BMC-Widget" data-cfasync="false" src="https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js" data-id="anir0y" data-description="Support me on Buy me a coffee!" data-message="" data-color="#5F7FFF" data-position="Right" data-x_margin="18" data-y_margin="18"></script>

<!-- EOF -->
