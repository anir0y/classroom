---
title: python pip2 Install
date: 2021-07-03T01:30:12+05:30
lastmod: 2021-07-03T01:30:12+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
cover:
  image: /img/blog.png
  alt: "cover image"

categories:
  - Python
tags:
  - pip2
  - pip
  

draft: false
description: "How to install pip2 for Python 2.7 on Kali Linux — quick installation script and usage guide for legacy Python modules."

---
## PIP 2 installation

in last few weeks I've seen people are asking for how to install pip2 in latest Kali linux, here is the answer. once installation is done, you can find it as `pip2`
and then you can use it to install `pip2` i.e. `python 2.7` modules.

<script src="https://gist.github.com/anir0y/a20246e26dcb2ebf1b44a0e1d989f5d1.js"></script>

### how to?

download the script and run here is how:

```zsh
wget https://gist.githubusercontent.com/anir0y/a20246e26dcb2ebf1b44a0e1d989f5d1/raw/a9908e5dd147f0b6eb71ec51f9845fafe7fb8a7f/pip2%2520install -O run.sh 
chmod +x run.sh #wget will save the output as run.sh
./run.sh #execute to install the pip2
```

wait till it shows, "DONE!"

you're good to go!---