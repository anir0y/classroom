---
title: How to Trust Imported GPG Keys
date: 2023-05-30T11:59:25+05:30
lastmod: 2023-05-30T11:59:25+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
cover:
  image: /img/gpg.png
  alt: "cover image"
simg: /img/gpg.png

categories:
  - gpg
tags:
  - gpg


draft: false
description: Learn how to trust imported GPG keys using the web of trust, keyserver, or manually. GPG, trust, imported keys, web of trust, keyserver, manual trust

---

## TLDR 

> When you import a GPG key, you are trusting that the key belongs to the person or organization who claims to own it. There are a few ways to trust imported GPG keys:
> 
> Web of trust: The web of trust is a decentralized system for verifying GPG keys. When you import a key, you can choose to trust it based on the trust of other people in the web of trust.
> Keyserver: A keyserver is a server that stores GPG keys. When you import a key, you can choose to trust it based on the trust of the keyserver.
> Manually: You can also manually trust a GPG key by adding it to your keyring with the gpg --edit-key command.
> Once you have trusted an imported GPG key, you can use it to encrypt and sign data.
> 
> TLDR: There are three ways to trust imported GPG keys: the web of trust, keyserver, or manually.# How to Trust Imported GPG Keys

When you import a GPG key, you are trusting that the key belongs to the person or organization who claims to own it. This is important because GPG keys are used to encrypt and sign data, and you need to be sure that you are only trusting the keys of people who you can verify.

There are a few ways to trust imported GPG keys:

* **Web of trust:** The web of trust is a decentralized system for verifying GPG keys. When you import a key, you can choose to trust it based on the trust of other people in the web of trust.
* **Keyserver:** A keyserver is a server that stores GPG keys. When you import a key, you can choose to trust it based on the trust of the keyserver.
* **Manually:** You can also manually trust a GPG key by adding it to your keyring with the `gpg --edit-key` command.

Once you have trusted an imported GPG key, you can use it to encrypt and sign data.

## Web of trust

The web of trust is a decentralized system for verifying GPG keys. When you import a key, you can choose to trust it based on the trust of other people in the web of trust.

To use the web of trust, you need to know the fingerprint of the key you want to trust. You can find the fingerprint of a key by running the `gpg --fingerprint` command.

Once you have the fingerprint of the key you want to trust, you can find people who trust that key by searching the web of trust. There are a number of websites that allow you to search the web of trust, such as [Keybase](https://keybase.io/) and [UBUNTU Keyserver](https://keyserver.ubuntu.com/).

When you find someone who trusts the key you want to trust, you can add their trust to your own trust. To do this, you need to import their key and then use the `gpg --edit-key` command to add their trust to your keyring.

## Keyserver

A keyserver is a server that stores GPG keys. When you import a key, you can choose to trust it based on the trust of the keyserver.

To use a keyserver, you need to know the keyserver's URL. You can find the URL of a keyserver by searching the web.

Once you know the URL of a keyserver, you can import a key by running the `gpg --recv-keys` command.

For example, to import the key with fingerprint `2431 62C3 B284 BC32 CB11 03B1 A217 B9F4 5304 6C23`, hosted in `keyserver.ubuntu.com` you would run the following command:

`gpg --keyserver keyserver.ubuntu.com --recv-keys 243162C3B284BC32CB1103B1A217B9F453046C23` 

![img](https://i.imgur.com/271yeJS.png)

Once you have imported a key, you can trust it based on the trust of the keyserver. To do this, you need to use the gpg --edit-key command to add the keyserver's trust to your keyring.

by default key won't be trusted as you can see it here:

![img](https://i.imgur.com/SC2Em09.png)

Manually
You can also manually trust a GPG key by adding it to your keyring with the gpg --edit-key command.

To do this, you need to know the fingerprint of the key you want to trust. You can find the fingerprint of a key by running the gpg --fingerprint command.

Once you have the fingerprint of the key you want to trust, you can add it to your keyring by running the following command:

`gpg --edit-key 2431 62C3 B284 BC32 CB11 03B1 A217 B9F4 5304 6C23`

![img](https://i.imgur.com/DbeVD1A.png)

Once you have added the key to your keyring, you can trust it by pressing `y` when prompted.

Once you have trusted an imported GPG key, you can use it to encrypt and sign data.

![img](https://i.imgur.com/sIMBToL.png)


---

> Liked the article? share your feedback here: [ twitter](https://twitter.com/anir0y)
<!-- //====================\\ -->
<!-- || GPG post by anir0y || -->
<!-- \\====================// -->

