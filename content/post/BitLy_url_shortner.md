---
title: BitLy url shortner
date: 2022-11-29T15:32:55+05:30
lastmod: 2022-11-29T15:32:55+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
featureimage: img/bitly.png
simg: /img/bitly.png

categories:
  - urlshortner



description: using BITLY URL API create your own URL shortner Script using Python.
---

## OverView

we're going to write a python script to get short URLs using [Bit.ly](https://bit.ly/) 



## get the API from BITLY 


signup to [bitly.com](bitly.com) and login to the dashboard, then click on `API` section and click on create API 

ref to the image below: 

![img](https://i.imgur.com/lsjJQTc.png)

*follow the instructions:*

1. click on settings after login
2. click on API
3. Enter your password and then 
4. click on generate token. 

save the token as we will be using it on our script. 

**next** is to get the group ID, to get this follow the instruction below: 

![img](https://i.imgur.com/pxZuERt.png)

1. click on settings 
2. click on groups, click on the the group name  

in my case, I'll be clicking on `main` then 

![img](https://i.imgur.com/3Xh9TUm.png)

copy the `ID` shown in URL. 

and that's it!!! 

now you have all the things you need to edit on script:

API and the Group ID. 

now copy the script and add those info, delete '{}' from {token}// like the example here

 `'Authorization': 'Bearer {TOKEN}'` to  `'Authorization': 'Bearer yourtokenhere'` 

add `group id` in `line 11`

and you're good to go

<script src="https://gist.github.com/anir0y/8eddd0af1cedd35ae8304237452fd92e.js"></script>