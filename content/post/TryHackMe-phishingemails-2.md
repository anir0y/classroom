---
title: TryHackMe Phishing Emails 2
date: 2022-01-26T13:16:10+05:30
lastmod: 2022-01-26T13:16:10+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
cover: /img/phishing-email-2.png # for tryhackMe
simg: /img/phishing-email-2.png

categories:
  - TryHackMe
tags:
  - tryhackme


draft: false
description: Try Hack Me Room Phishing Emails 2 solved by Animesh Roy. this is a walkthough. read more...

---

## OverView

|||
|---|---|
| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|Phishing Emails 2|![logo](https://tryhackme-images.s3.amazonaws.com/room-icons/aba648a3f311e86dd79299d5562654e3.png)|
| <b> Phishing Emails 2 [FREE ROOM] </b>| [Phishing Emails 2](https://tryhackme.com/room/phishingemails2rytmuv)|

## Task 01: Introduction

`read the task`

## Task 02: Cancel your PayPal order

The email sample in this task will highlight the following techniques:

* Spoofed email address
* URL shortening services
* HTML to impersonate a legitimate brand

Here are some quick observations about this email sample:

1. This is an unusual email recipient address. This is not the email address associated with the Yahoo account. 
2. This mismatch should immediately stand out. The sender's details (service@paypal.com) don't match the sender's email address (gibberish@sultanbogor.com). 
3. The subject line hints that you made a purchase or a transaction of some sort. If you don't recall this account, then it will grab your attention. This social engineering tactic is to prompt you to interact with the email with haste. 

![img](https://assets.tryhackme.com/additional/phishing2.0/email1-details.png)

Now let's look at the contents of the email body.

**Email Body Text (Image 1):**

![img](https://assets.tryhackme.com/additional/phishing2.0/email-body-1.png)

**The second half of the same email body text (Image 2):**

![img](https://assets.tryhackme.com/additional/phishing2.0/email-body-2b.png)

The email body compliments the sender information and subject line. The email was designed as a legitimate email from PayPal. 

There aren't any attachments associated with this email. The only interactive element in this email is the Cancel the order button/link. 

Let's investigate that further by reviewing the raw HTML source for the email...

Email Hyperlinks:

![img](https://assets.tryhackme.com/additional/phishing2.0/cancel-order.png)

The link uses URL shortening services. It is not a good idea to click on the link if you don't know where the link is taking you. 

Luckily, there are online tools that we can use to let us know the destination of a shortened URL. 

![img](https://assets.tryhackme.com/additional/phishing2.0/email1-url-shortener.png)

Strange. This link redirects to google.com. 

**Note**: Tools to expand shortened URLs will be discussed in the Phishing Emails 3 room.  

### Answer the questions below [02]

#### What phrase does the gibberish sender email start with?

`noreply`

---

## Task 03: Track your package

This email sample will highlight the following techniques:

* Spoofed email address
* Pixel tracking
* Link manipulation

Here are some quick observations about this email sample:

* The email is tailored to appear that it's sent from a mail distribution center of some sort. 
* The subject line adds to the pretense with a 'tracking number.' 
* The link in the email body matches the subject line. 

![img](https://assets.tryhackme.com/additional/phishing2.0/email2-details.png)

**Note**: In this email sample, Yahoo blocked the images from automatically loading. Any guesses as to why? 

Typically one can hover the cursor over a link to see where the link is pointing to, but in this sample, that technique won't work because Yahoo disabled links in the email.  We can look at the raw source code for the email and find out. 

**Email Hyperlinks:**

![img](https://assets.tryhackme.com/additional/phishing2.0/email2-hyperlinks.png)

Here we see an image file, and it's explicitly called Tracking.png. These trackers send information back to the spammer's server. 

There are many reasons for spammers to embed tracking pixels (very small images) into their spam emails. 

Now we can understand why Yahoo automatically blocked the images in this email. Many email providers do the same. 

Back to the hyperlink, the link is pointing to a shady-looking domain. The only distribution center this domain can be associated with is malware, but further analysis is the only way to confirm that definitely. 

### Answer the questions below[3]

#### What is the root domain for each URL? Defang the URL. 

`cyberchef is your goto` 

Ref : [here](https://gchq.github.io/CyberChef/#recipe=Defang_URL(true,true,true,'Valid%20domains%20and%20full%20URLs')&input=YW5pcjB5Lmlu) ; change the domain name. 

---

## Select your email provider to view document

This email sample will highlight the following techniques:

* Urgency
* HTML to impersonate a legitimate brand
* Link manipulation
* Credential harvesting
* Poor grammar and/or typos

Let's take a closer look...

![img](https://assets.tryhackme.com/additional/phishing2.0/email6-details2.png)

Here are some quick observations about this email sample:

1. The email was sent on Thursday, July 15th, 2021.  
2. A sense of urgency is introduced in this email. Notice that the link to download the fax document expires on the same day.
3. There is an action to perform. In this case, a button to download the fax. 

![img](https://assets.tryhackme.com/additional/phishing2.0/email6-phish1b.png)

The above image shows the victim is redirected to a page created to pass as OneDrive. Notice that the URL is not anything Microsoft-related. 

There are two more links for the victim to interact with. The victim has to click either button to obtain the fax document that is set to expire. 

![img](https://assets.tryhackme.com/additional/phishing2.0/email6-phish2b.png)

The victim is directed to yet another site. This one was crafted to resemble Adobe. Again, notice the URL. It doesn't look like it's related to Adobe.

Also, notice the page title in the tab. It's called "Share Point Online", which is a Microsoft product.  There are a couple of grammatical errors as well. 

The victim has options to sign in with the email provider of their choice. 

![img](https://assets.tryhackme.com/additional/phishing2.0/email6-phish3.png)

Our victim chose to log in with Outlook because, per the instructions, "To read the document, please enter with the valid email credentials that this file was sent to."; the email was viewed in Outlook. 

![img](https://assets.tryhackme.com/additional/phishing2.0/email6-phish4.png)

In this sample, we can tell that fake credentials were entered, but even if the victim would have entered valid credentials, the error message would be the same. This scenario happens because the victim is not really authenticating to an email provider. Instead, the credentials that were entered now reside on the criminal's server. The criminal's objective to harvest credentials has been met. 

Lastly, notice more grammatical errors. All this work they put into this, you would think they would run a spell check. 

This email sample was obtained from Any Run. If you wish to interact with the email and see the full analysis, refer to the link below.

Analysis: https://app.any.run/tasks/12dcbc54-be0f-4250-b6c1-94d548816e5c/#

### Answer the questions below [4]

#### This email sample used the names of a few major companies, their products, and logos such as OneDrive and Adobe. What other company name was used in this phishing email?

`read the first screenshot carefully`

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

## Task 5: Please update your payment details

This email sample will highlight the following techniques:

* Spoofed email address
* Urgency
* HTML to impersonate a legitimate brand
* Poor grammar and/or typos
* Attachments

Here are some quick observations about this email sample:

1. This email is made to appear that it's from Netflix Billing, but the sender address is z99@musacombi.online. 
2. Here is the element of urgency. The account was suspended, so the victim must act quickly. 
3. There is more of this sense of urgency in the email body. 

![img](https://assets.tryhackme.com/additional/phishing2.0/email3-details.png)

Also, notice the different misspellings of the word Netflix. Not sure what was the purpose of that. 

Typically, you'll see this technique when it comes to [typosquatting](https://www.csoonline.com/article/3600594/what-is-typosquatting-a-simple-but-effective-attack-technique.html), but that wasn't the case here.

![img](https://assets.tryhackme.com/additional/phishing2.0/email3-typos.png)

Ok, here is the meat and potatoes of this email. Apparently, the victim needs to open the attachment (PDF) to update their Netflix account. 

![img](https://assets.tryhackme.com/additional/phishing2.0/email3-body-attachment.png)

Notice the phone number for 'Netflix'. At first glance, that is an unusual phone number to send to a US-based victim. 

![img](https://assets.tryhackme.com/additional/phishing2.0/email3-attachment2.png)

The attachment contains an embedded link titled 'Update Payment Account'. 

### Answer the questions below [5]

#### What should users do if they receive a suspicious email or text message claiming to be from Netflix?

`Read the article, you'll have the answer` : [netflix-phishing](https://www.consumeraffairs.com/news/police-warn-of-new-netflix-email-phishing-scam-121718.html)

[spoiler](Netflix are advised to forward the message to phishing@netflix.com)

---

## Task 6: Your recent purchase

This email sample will highlight the following techniques:

* Spoofed email address
* Recipient is BCCed
* Urgency
* Poor grammar and/or typos
* Attachments

Here are some quick observations about this email sample:

1. This email is made to appear that it's from Apple Support, but the sender's address is gibberish@sumpremed.com. 
2. This email wasn't sent directly to the victim's inbox but rather BCCed (Blind Carbon Copy). The recipient email looks like another spoofed email to appear as a legitimate Apple email address. 
3. Here is the element of urgency. Action is required on behalf of the victim. 

![img](https://assets.tryhackme.com/additional/phishing2.0/email5-details2.png)

There are a few noticeable typos in both the sender and recipient email addresses: donoreply and payament.

This particular email doesn't necessarily have an email body. It's totally blank. The email simply contains an attachment. 

![img](https://assets.tryhackme.com/additional/phishing2.0/email5-attachment.png)

This file extension you may not be familiar to you. A [.DOT](https://www.reviversoft.com/en/file-extensions/dot) file is page layout template files associated with Microsoft Word. 

![img](https://assets.tryhackme.com/additional/phishing2.0/email5-attachment2.png)

The above image shows what is contained within the attachment. You can see that the file contains a large image to resemble an App Store receipt. 

Notice the link contains certain keywords related to Apple: apps and ios. 

### Answer the questions below [6]

#### What does BCC mean?

`read the info, it's there`

#### What technique was used to persuade the victim to not ignore the email and act swiftly?

`read the info, it's there`

---

## Task 07:  DHL Express Courier Shipping notice

This email sample will highlight the following techniques:

* Spoofed email address
* HTML to impersonate a legitimate brand
* Attachments

Here are some quick observations about this email sample:

1. The sender's email doesn't match the company that is being impersonated, which in this case is DHL.
2. The subject line gives the impression that there is a package DHL will ship for you.
3. The HTML in the email body was designed to look like it was sent from DHL. 

![img](https://assets.tryhackme.com/additional/phishing2.0/email4-details.png)

Looking at the source code for the email, the link to view the email as a web page doesn't contain an actual destination URL. 

![img](https://assets.tryhackme.com/additional/phishing2.0/email4-body-2.png)

The only element the victim can interact with in this email is the email attachment, which, in this case is an Excel document. 

![img](https://assets.tryhackme.com/additional/phishing2.0/email4-attachment.png)

The image below shows what is contained within the attachment.

![img](https://assets.tryhackme.com/additional/phishing2.0/email4-attachment2.png)

The attachment runs a payload that throws an error. 

![img](https://assets.tryhackme.com/additional/phishing2.0/email4-attachment3.png)

### Answer the questions below [7]

#### What is the name of the executable that the Excel attachment attempts to run?

ref to this img [link](https://assets.tryhackme.com/additional/phishing2.0/email4-attachment3.png)

---

## Task 08: Conclusion

In this room, we looked at various phishing samples. 

Some of the samples shared similar techniques whereas, others introduced a new tactic for you to see and learn from. 

Understanding how to detect phishing emails takes awareness training.

Visit the resources below to acquaint yourself with other signs to look out for in phishing emails. 

Additional Resources:

* https://www.knowbe4.com/phishing
* https://www.itgovernance.co.uk/blog/5-ways-to-detect-a-phishing-email
* https://cheapsslsecurity.com/blog/10-phishing-email-examples-you-need-to-see/
* https://phishingquiz.withgoogle.com


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
