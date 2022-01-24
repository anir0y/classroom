---
title: Try Hack Me Phishing Emails 1
date: 2022-01-24T17:33:15+05:30
lastmod: 2022-01-24T17:33:15+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
cover: /img/phish-e-1.png # for tryhackMe
simg: /img/phish-e-1.png

categories:
  - TryHackMe
tags:
  - tryhackme


draft: false
description: Try Hack Me Room Phishing Emails 1 solved by Animesh Roy. this is a walkthough. read more...

---

## OverView

|||
|---|---|
| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|Phishing Emails 1|![logo](https://tryhackme-images.s3.amazonaws.com/room-icons/f9eb29940c6bb7bacd2f414475b4059e.png)|
| <b> Phishing Emails 1 [FREE ROOM] </b>| [Phishing Emails 1](https://www.tryhackme.com/room/phishingemails1tryoe)|

## Task 01:  Introduction

``` read the task ```

## Task 02: The email address

It's only appropriate to start this room by mentioning the man who invented the concept of emails and made the @ symbol famous. The person responsible for the contribution to the way we communicate was Ray Tomlinson. 

The invention of the email dates back to the 1970s for ARPANET. Yep, probably before you were born. Definitely, before I was born. :)

So, what makes up an email address?

1. User Mailbox (or Username)
2. @
3. Domain

Let's look at the following email address, billy@johndoe.com.

1. The user mailbox is billy
2. @ (thanks Ray)
3. The domain is johndoe.com

To simplify this even further, think about the street on which you live on.

* You can think of your street as the domain. 
* The recipient's first/last name, along with the house number in this scenario, represents the user mailbox. 

With this information, the postal worker delivering the mail knows into which mailbox to put the letter(s). 

Next, let's look at the network protocols used to send an email from the sender to the recipient.

### Task 03: Email Delivery

A handful of protocols are involved with the "magic" that takes place when you hit SEND in an email client. 

By now, you should already know that certain protocols were created to handle specific network-related tasks, such as email. 

There are 3 specific protocols involved to facilitate the outgoing and incoming email messages, and they are briefly listed below

* **SMTP (Simple Mail Transfer Protocol)** - It is utilized to handle the sending of emails.

* **POP3 (Post Office Protocol)** - Is responsible transferring email between a client and a mail 

* **IMAP (Internet Message Access Protocol)** - Is responsible transferring email between a client and a mail server

**POP3**

* Emails are downloaded and stored on a single device.
* Sent messages are stored on the single device from which the email was sent.
* Emails can only be accessed from the single device the emails were downloaded to.
* If you want to keep messages on the server, make sure the setting "Keep email on server" is enabled, or all messages are deleted from the server once downloaded to the single device's app or software.

**IMAP**

* Emails are stored on the server and can be downloaded to multiple devices.
* Sent messages are stored on the server.
* Messages can be synced and accessed across multiple devices.

Now let's talk about how email travels from the sender to the recipient.

To best illustrate this, see the oversimplified image below:

![img](https://assets.tryhackme.com/additional/phishing1/email-network-flow-4.png)

Below is an explanation of each numbered point from the above diagram:

1. Alexa composes an email to Billy (billy@johndoe.com) in her favorite email client. After she's done, she hits the send button
2. The SMTP server needs to determine where to send Alexa's email. It queries DNS for information associated with johndoe.com. 
3. The DNS server obtains the information johndoe.com and sends that information to the SMTP server. 
4. The SMTP server sends Alexa's email across the Internet to Billy's mailbox at johndoe.com.
5. In this stage, Alexa's email passes through various SMTP servers and is finally relayed to the destination SMTP server. 
6. Alexa's email finally reached the destination SMTP server.
7. Alexa's email is forwarded and is now sitting in the local POP3/IMAP server waiting for Billy. 
8. Billy logs into his email client, which queries the local POP3/IMAP server for new emails in his mailbox.
9. Alexa's email is copied (IMAP) or downloaded (POP3) to Billy's email client. 

Lastly, each protocol has its associated default ports and recommended ports. For example, SMTP is port 25.

Read the following article to understand the difference between each [here](https://help.dreamhost.com/hc/en-us/articles/215612887-Email-client-protocols-and-port-numbers).

### 3 Flags

#### What port is classified as Secure Transport for SMTP?

`465`

#### What port is classified as Secure Transport for IMAP?

`993`

#### What port is classified as Secure Transport for POP3?

`995`

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

---

## Task 04: Email Headers

Great! We know how an email travels from point A to point B and all the protocols involved in the process. 

This task is to understand the components of what makes up an email message when it arrives in an inbox.

This understanding is necessary if you wish to analyze potentially malicious emails manually. 

Before we begin, we need to understand that there are two parts to an email:

* the email header (information about the email, such as the email servers that relayed the email)

* the email body (text and/or HTML formatted text)

The syntax for email messages is known as the Internet Message Format ([IMF](https://datatracker.ietf.org/doc/html/rfc5322)).

Let's look at email headers first. 

What do you look for when analyzing a potentially malicious email?

Let's start with the following email header fields:

1. From - the sender's email address
2. Subject - the email's subject line
3. Date - the date when the email was sent
4. To - the recipient's email address

This is usually clearly visible in any email client. Let's look at an example of these fields in the below image.

**Warning**: This is a snippet from an actual email. The email in the below image is from a honeypot Yahoo email address. Don't engage/interact with the email addresses or IP addresses revealed in this room.

![img](https://assets.tryhackme.com/additional/phishing1/email-headers-1b.png)

Note: The numbers in the above image correspond to the email header fields bullet list above.

Another method to obtain the same email header information, and more, is by viewing the 'raw' email details.

When looking at an email header in detail, it can be intimidating at first, but it's not so bad if you know what to look for. 

Note: Depending on your email client, whether a web client or a desktop app, the steps to view these email header fields will vary, but the concept is the same. 

Review this Knowledge Base (KB) article from Media Temple on viewing the raw/full email headers in various email clients [here](https://mediatemple.net/community/products/grid/204644060/how-do-i-view-email-headers-for-a-message). 

In the below image, you can see how to view this information within Yahoo.

![img](https://assets.tryhackme.com/additional/phishing1/email-raw-headers-menu-2.png)

Below is a snippet of the raw message for the email sample.

![img](https://assets.tryhackme.com/additional/phishing1/email-raw-headers-2b.png)

Note: The above image shows some, not all, of the information within an email's header. 

You can review this email in the Email Samples directory on the Desktop within the attached virtual machine. The email is titled `email1.eml`. 

From the above image, there are other email header fields of interest. 

1. **X-Originating-IP** - The IP address of the email was sent from (this is known as an X-header)
2. **Smtp.mailfrom/header.from** - The domain the email was sent from (these headers are within Authentication-Results)
3. **Reply-To** - This is the email address a reply email will be sent to instead of the From email address

To clarify, in the email in the sample above, the Sender is newsletters@ant.anki-tech.com, but if a recipient replies to the email, the response will go to reply@ant.anki-tech.com, which is the Reply-To, and NOT to newsletters@ant.anki-tech.com. 

### 4 Flags

#### What email header is the same as "Reply-to"?

`Return-Path`

#### Once you find the email sender's IP address, where can you retrieve more information about the IP?

`http://www.arin.net`

---

## Task 05: Email Body

The email body is the part of the email which contains the text (plain or HTML formatted) the sender wants you to view. 

Below is an example of a text-only email.

![img](https://assets.tryhackme.com/additional/phishing1/email-text-2.png)

Below is an example of the HTML formatted email.

![img](https://assets.tryhackme.com/additional/phishing1/email-html-2.png)

The above email contains an image (which was blocked by the email client) and embedded hyperlinks.

HTML is what makes it possible to add these elements to an email.

To view an email's HTML code is the same approach shown below, but it may vary depending on the webmail client. 

In the example below, the screenshot is from Protonmail. 

![img](https://assets.tryhackme.com/additional/phishing1/email-source-code-2.png)

A snippet of the HTML code is shown below.

![img](https://assets.tryhackme.com/additional/phishing1/email-html-code.png)

In this specific email web client, Protonmail, the option to switch back to HTML is called "View rendered HTML".

![img](https://assets.tryhackme.com/additional/phishing1/email-render-html.png)

Again, it will be different for other webmail clients.

Lastly, emails may contain attachments. The same premise applies; you can view an email's attachment from an email's HTML format or by viewing the source code. 

Let's look at a few examples below.

The following example is an HTML formatted email from "Netflix" with an attachment. The web client is Yahoo!

![img](https://assets.tryhackme.com/additional/phishing1/email-with-attachment.png)

1. The email body has an image.
2. The email attachment is a PDF document.

Now let's view this attachment within the source code.

![img](https://assets.tryhackme.com/additional/phishing1/email-with-attachment-2.png)

From the above example, we can see the headers associated with this attachment:

* Content-Type is application/pdf. 
* Content-Disposition specifies it's an attachment. 
* Content-Transfer-Encoding tells us it's base64 encoded. 

With the base64 encoded data, you can decode it and save it to your machine.

Warning: When interacting with attachments, proceed with caution and make sure you don't double-click an email's attachment by accident. 

Note: Headers specific to 'content' can be found in various locations within an email message source code, and they're not only associated with attachments. For example, Content-Type can be text/html, and Content-Transfer-Encoding can have other values, such as 8bit. 

### 5 Flags

#### In the above screenshots, what is the URI of the blocked image?

`https://i.imgur.com/LSWOtDI.png`

#### In the above screenshots, what is the name of the PDF attachment?

`payment-updateid.pdf`

#### In the attached virtual machine, view the information in email2.txt and reconstruct the PDF using the base64 data. What is the text within the PDF?

**Solution**

* open the email text
* copy the encoded content
* open `~/Desktop/tools` and open cyberchef.html 
* paste the encoded content in input select `from base64` decode option and save the blob as `download.pdf` instead of `download.dat` file
* open the `download.pdf` read the flag.

---

## Task 06: Types of Phishing

Different types of malicious emails can be classified as one of the following:

* **Spam** - unsolicited junk emails sent out in bulk to a large number of recipients. The more malicious variant of Spam is known as MalSpam.

* **Phishing** -  emails sent to a target(s) purporting to be from a trusted entity to lure individuals into providing sensitive information.

* **Spear phishing** - takes phishing a step further by targeting a specific individual(s) or organization seeking sensitive information.  

* **Whaling** - is similar to spear phishing, but it's targeted specifically to C-Level high-position individuals (CEO, CFO, etc.), and the objective is the same.

* **Smishing** - takes phishing to mobile devices by targeting mobile users with specially crafted text messages. 

* **Vishing** - is similar to smishing, but instead of using text messages for the social engineering attack, the attacks are based on voice calls. 

When it comes to phishing, the modus operandi is usually the same depending on the objective of the email.

For example, the objective can be to harvest credentials, and another is to gain access to the computer. 

Below are typical characteristics phishing emails have in common:

* The sender email name/address will masquerade as a trusted entity (email spoofing)

* The email subject line and/or body (text) is written with a sense of urgency or uses certain keywords such as Invoice, Suspended, etc. 

* The email body (HTML) is designed to match a trusting entity (such as Amazon)

* The email body (HTML) is poorly formatted or written (contrary from the previous point)

* The email body uses generic content, such as Dear Sir/Madam. 

* Hyperlinks (oftentimes uses URL shortening services to hide its true origin)

* A `malicious attachment` posing as a legitimate document

We'll look at each of these techniques (characteristics) in greater detail in the next room within the Phishing module.

*Reminder*: When dealing with hyperlinks and attachments, you need to be careful not to accidentally click on the hyperlink or the attachment. 

Hyperlinks and IP addresses should be 'defanged'. You can read more about this technique [here](https://www.ibm.com/docs/en/rsoa-and-rp/32.0?topic=SSBRUQ_32.0.0/com.ibm.resilient.doc/install/resilient_install_defangURLs.htm). 

Analyze the email titled `email3.eml` within the virtual machine and answer the questions below.

*Note*: Alexa is the victim, and Billy is the analyst assigned to the case. Alexa forwarded the email to Billy for analysis. 

### 6 flags

#### What trusted entity is this email masquerading as?

* found this "From: " address 

![img](https://i.imgur.com/Cc9rFBa.png)

* decode this using `cyber chef`

![img](https://i.imgur.com/NZiBBnh.png)

#### What is the sender's email?

![img](https://i.imgur.com/zygbSsj.png)

#### What is the subject line? 

* copy the encoded `Subject` and decode it with `cyber chef`

![img](https://i.imgur.com/yzUKJkS.png)

#### What is the URL link for - CLICK HERE? (Enter the defanged URL)

![img](https://i.imgur.com/cKxCcfE.png)

ref: `http://t.teckbe.com/p/?j3=3DEOo=wFcEwFHl6EOAyFcoUFVTVEchwFHlUFOo6lVTTDcATE7oUE7AUET=3D=3D`

Copy and paste the link found in the header to CyberChef in the input in the VM and use the following recipe.

![img](https://i.imgur.com/ZrbmVXv.png)

now you have a url starts with `hxxp` that's the flag.

----

## Task 7: Conclusion

#### What is BEC?

`Business Email Comp....; go figure `








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
