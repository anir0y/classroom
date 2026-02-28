---
title: DVWA Docker Setup
date: 2022-03-05T21:05:05+05:30
lastmod: 2022-03-05T21:05:05+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
featureimage: img/dvwa-main.png
simg: /img/dvwa-main.png

categories:
  - labs
tags:
  - dvwa

draft: false
description: "Set up DVWA (Damn Vulnerable Web Application) with Docker — quick install guide for practicing web application security testing."

---

# Damn Vulnerable Web Application Docker container

Damn Vulnerable Web Application (DVWA) is a PHP/MySQL web application that is damn vulnerable. Its main goal is to be an aid for security professionals to test their skills and tools in a legal environment, help web developers better understand the processes of securing web applications and to aid both students & teachers to learn about web application security in a controlled class room environment.

The aim of DVWA is to practice some of the most common web vulnerability, with various difficultly levels, with a simple straightforward interface. Please note, there are both documented and undocumented vulnerability with this software. This is intentional. You are encouraged to try and discover as many issues as possible.

WARNING This image is vulnerable to several kinds of attacks, please don't deploy it to any public servers.

## Run this image

To run this image you need [docker](#install-docker) installed. once you have docker installed, Just run the command:

`docker run --rm -it -p 80:80 anir0y/anir0y-dvwa`

And wait until it download the image and start it, after that you can see the image running in your local machine:

![dvwa](https://i.imgur.com/oJHjR53.png)

Just click on the Create / Reset database button and it will generate any aditional configuration needed.

## Login with default credentials

**creds are hidden in** 

* response Header
* F12 Hack 

---

## install Docker

![docker](https://www.docker.com/sites/default/files/d8/2019-07/horizontal-logo-monochromatic-white.png)

### Follow this guide to [install Docker](https://www.docker.com/get-started)