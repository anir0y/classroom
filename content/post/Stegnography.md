---
title: Stegnography with Steghide
date: 2022-05-26T21:42:28+05:30
lastmod: 2022-05-26T21:42:28+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
cover: /img/blog.png # for tryhackMe
simg: /img/blog.png

categories:
  - Training

draft: false
description: Steghide Is an open-source, command-line software that can encode and decode data into image files

---

# Choice of tools

Steghide: Is an open-source, command-line software that can encode and decode data into image files

Features:

* compression of embedded data
* encryption of embedded data
* embedding of a checksum to verify the integrity of the extracted data
* support for JPEG, BMP, WAV and AU files

## Installation (Linux)

     apt-get install steghide

## Creating an image with a secret message in it.

1. Create a folder with the name of your choice:
     
     `mkdir steghide`

2. Create a new text files with some text. – This will be the secret that we want to embed in the image of our choice.

     `cd steghide`

     `echo "They Screct message" > secret_msg.txt`
`
3. Download or use an image of your choice to hide the secret message

> For this example we used his test image that you can download it using wget <image link>, and experiment on it, or you can choose your own.

     wget https://i.imgur.com/PjtSBur.jpg

4. Hide secret message in image and create a new encrypted file

     `steghide embed -cf PjtSBur.jpg -ef message.txt -sf secret.jpg`

This command will embed the file message.txt in the PjtSBur.jpg and create a new encrypted image, secret.jpg (stego file).

* Embed: embed data
* -cf: cover file
* -ef: embed file
* -sf: output file – stego file

## man 
You can also choose between different encryption algorithms and compression levels.
See the user manual of steghide with: 

     man steghide

5. It will prompt you to enter a passphrase needed to then later extract the message.txt from the secret.jpg image.

6. Enter a passphrase and re-enter it for confirmation

## View info or the embedded data

You can get some information before extracting the stego file. To view the encryption algorithm, file size, and the embedded filename/secret message filename using the command below:

     steghide info secret.jpg


## Retrieve information of the embedded file (stego file)
The way to decode and reveal the secret message embed in the stego file. Make sure to rename or remove the original message.txt from the working folder when performing this command.


     steghide extract -sf secret.jpg


# Bonus 
**Stegosuite**: Is a graphical interface steganographic tool written in Python for hiding data/extracting data them from images and more features.

`sudo apt-get install stegosuite`

**Run stegosuite:** type `stegosuite` in terminal it will start the GUI version of steghide tool. 

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
