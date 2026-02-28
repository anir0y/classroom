---
title: "Volatility Installation in Linux"
date: 2021-03-17T01:00:08+05:30
lastmod: 2021-03-17T01:00:08+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
cover:
  image: /img/cover.jpg
  alt: "cover image"
categories:
  - DFIR
  - forensic
tags:
  - memory 
  - forensic
  - tools
  - Volatility
draft: false
---


# How to Install Volatility 2.6 in Kali 


Volatility is no longer packaged with new Kali releases, but can be manually installed. 

``` zsh
┌──(kali㉿kali)-[~/volatility]
└─$ vol.py   
 Volatility Foundation Volatility Framework 2.6.1

 *** Failed to import volatility.plugins.registry.shutdown (ImportError: No module named Crypto.Hash)

 *** Failed to import volatility.plugins.getservicesids (ImportError: No module named Crypto.Hash)

 *** Failed to import volatility.plugins.timeliner (ImportError: No module named Crypto.Hash) 

 *** Failed to import volatility.plugins.malware.apihooks (NameError: name 'distorm3' is not defined)

 *** Failed to import volatility.plugins.malware.threads (NameError: name 'distorm3' is not defined)

 *** Failed to import volatility.plugins.mac.apihooks_kernel (ImportError: No module named distorm3)
```
## As Volatility relies on certain Python 2 dependencies, we will need to install Python 2 Pip:

```bash
wget https://bootstrap.pypa.io/pip/2.7/get-pip.py
```
```bash
sudo python2 get-pip.py
# upgrade setup tools to avoid "invalid command egg_info" error
```
```python
pip2 install --upgrade setuptools
# install python-dev to avoid "x86_64-linux-gnu-gcc failed..." error
```
```bash
sudo apt-get install python-dev
```

## Now that pip2 is installed, we can use it to get the Volatility dependencies:

```python
pip2 install pycrypto
```
```python
pip2 install distorm3
```

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

## If you’re using it temporarily, you can simply clone the repo and run vol.py. Otherwise, you can run the python installer:

```bash
git clone https://github.com/volatilityfoundation/volatility
```
```
cd volatility
```
```
sudo python setup.py install
```

### Once the install is complete, you can verify by running vol.py in any context:

```
┌──(kali㉿kali)-[~]
└─$ vol.py -h
 Volatility Foundation Volatility Framework 2.6.1
 Usage: Volatility - A memory forensics analysis platform.
 ```

## You can use this automated script: [bash script](https://gist.github.com/anir0y/5ca6b6356f769d80e0ff12221b3b259b)

<script src="https://gist.github.com/anir0y/5ca6b6356f769d80e0ff12221b3b259b.js"></script>

> The install script will place the plugins directory to /usr/local/contrib/plugins