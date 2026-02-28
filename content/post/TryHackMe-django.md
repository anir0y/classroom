---
title: TryHackMe Introduction to Django
date: 2021-09-11T18:40:31+05:30
lastmod: 2021-09-11T18:40:31+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
cover:
  image: /img/Django.gif
  alt: "cover image"
simg: /img/Django.gif 

categories:
  - TryHackMe
tags:
  - tryhackme
  - rooms
  - thm

draft: false
description: TryHackMe Room Introduction to Django solved by Animesh Roy. this is a walkthough. read more...

---

## OverView

|||
|---|---|
| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|Django|![logo](https://tryhackme-images.s3.amazonaws.com/room-icons/c11fb449f10add8bc11a137fef9e979c.png)|
| <b> Room [Subscription Required] </b>| [Django](https://tryhackme.com/room/django)|

## 01: Introduction

Learning Python can be extremely useful for penetration testers, and a simple understanding of its frameworks can be a key to success. In this lesson, we are going to learn about one of the best ones ever made: Django. 

Django is a high-level Python web framework that enables rapid development of secure and maintainable websites. It allows you to develop websites and web applications in a matter of hours.

Django can automatically compile HTML code, therefore making it possible for anyone without any advanced knowledge in markup languages to develop a website. Additionally, Django is arguably one of the most secure developing frameworks, which in the right configuration, can strongly resist against SQL injections and XSS.

All in all, if you are familiar with Python and considering creating a website, Django can be a really good choice. As for penetration tester, it is important to understand the basic structure of Django-powered websites in order to be able to identify possible weaknesses and mistakes a developer can make.

---

## 02: Getting started

For this room, we are going to use Python 3. (Any 3.x.x works here) with Django 2.2

Install Django by running this command:

`pip3 install Django==2.2.12`

Now we are ready to create and properly configure our first website.

Make a directory for your project files and navigate there with the command prompt.

run `django-admin startproject {project_name}` in order to start your project. (Replace {project_name} with your prefered name).

Run `python3 manage.py migrate` to automatically configure new files.

After creating the project you can see that Django creates a file `manage.py` and a file directory named after your project.

`manage.py` is a command-line utility that lets you interact with your Django project in various ways. It is especially handy in creating web-apps, managing databases, and most importantly running the server.

Basic syntax for using this utility is `python3 manage.py {command}`

`>runserver`

Runserver is the most important command used with manage.py; It allows you to deploy your website on the server. Django has a wonderful feature that allows you to instantly see changes made on the website without restarting it. (It is only necessary to restart runserver command when adding a new app).

Run this command and navigate to your website with IP given in the outline. You should see a page like this:

![img](https://i.imgur.com/sPAlYxt.png)

Note: If you are willing to run the server to your local network, just add 0.0.0.0:8000 after runserver command. (In case if you get an error afterward, just go to settings.py located your websites folder and add this address to ALLOWED_HOSTS)

![img](https://i.imgur.com/OXIf867.png)

`> createsuperuser`

This command allows you to create an admin account for your Django web admin panel. 

Run this command and access the panel at IP:8000/admin

![img](https://i.imgur.com/nGCEOV5.png)

`> startapp`

Startapp allows you to initialize an app for your project. Django projects can have infinite number of apps. Basic syntax:

`python3 manage.py startapp {app_name}`

### 02-Flags

|Answer the questions below| ans|
|---|---|
|How would we create an app called Forms? |`python3 manage.py startapp Forms`|
|How would we run our project to a local network?|`python3 manage.py runserver 0.0.0.0:8000`|

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

## 03: Creating a website

Now, let's go ahead and create a very simple app: 

1. Create an app using a command from Unit 2 and call it whatever you like. I will be using 'Articles' for this lesson.

2. Head over to settings.py and include your app name in *INSTALLED_APPS*:

![img](https://i.imgur.com/nBmIbMm.png)

3. Head over to urls.py (located in the main folder!) and include a path to your app there:

![img](https://i.imgur.com/LQO8uBx.png)

__Note that {app_name} should be replaced with your app's name.__

4. Migrate your changes by running `python3 manage.py migrate`

Your app is now located in the `https://IP:8000/{app_name}`

After successful app creation let's move over to the app directory and proceed there. As seen, Django automatically creates files inside your app folder. We are going to go through their purposes as we continue creating our website.

For now, create a file `urls.py` which will be especially handy in the closest future.

Generally speaking, Django-driven websites operate in this way:

![img](https://i.imgur.com/S5KdyNB.png)

urls.py is responsible for accepting and redistributing incoming HTTP requests via views.py

![img](https://i.imgur.com/amH7lgp.png)

Basic syntax for urls.py can be seen on the screenshot above.

We create a variable called `urlpatterns` in which we state names of our directories. `views.index` calls index function from `views.py` to be executed therefore creating some output response for HTTP request.

For example, if we are willing to create a directory called "archive", with function "main", we would include this in urls.py:

`path('archive/', views.main, name ='main')`

NOTE: Paths with blank directory ('') are going to call the function whenever the app is accessed at https://IP/{app_name}; any other directories are going to extend the link, for example, the archives directory I used above would be located in `https://IP/articles/archive`.

`views.py` is responsible for carrying out functions which are called using urls.py

Now let's create a simple HTTP response function for our app.

The syntax is pretty easy for this one. All you have to do is create a function with a certain name which you will be referring to in urls.py 

Here's an example of a function that returns "Hello, world!" message:

![img](https://i.imgur.com/hAHXPD8.png)

Note that in this case the function is called index, and so in order to make it work you need to put this line into your urls.py

`path('', views.index, name='index'),`

![img](https://i.imgur.com/Rt7S4NZ.png)

Now navigate to your http://IP:8000/{app_name} and see if "Hello, world!" popped out.

By this point, we were able to create a really simple website example that returns a text message. We are also able to create different apps and expand them with directories and went through the web part of Django server. 

Obviously, a simple HTTP Response isn't enough to properly display content. Django is able to automatically generate HTML markdown if properly told so. Templates are the ones who help us with that. 

Without further ado let's create a folder named templates in your app's folder and place a file named base.html into it. `Base.html` is going to play a role of a simply configured HTML example which in the long run, allows us to omit work with HTML.

Content of base.html is pretty basic and stays the same most of the time:

![img](https://i.imgur.com/J4TDAt7.png)

Now, create some another blank HTML file (index.html) and include this code in it:

![img](https://i.imgur.com/zpGwmXU.png)

As seen here, it uses base.html as its basis and allows us to input any simple or slightly HTML-marked text in-between `{% extends 'base.html'%} and {% endblock %}`. Try changing Hello World to some other text and now we are ready to make it work!

Remember what file is responsible for storing functions? views.py!

Head over there and change the index function to this code which will automatically render your template from index.html

![img](https://i.imgur.com/bhOJxt0.png)

Now check your text at http://IP:8000/{app_name}

You can create different templates for different functions and use them separately. For example, if you are creating a blog website, you might want to make templates for articles and homepage separately.

> In case if it was hard for you to follow the guide, or you have any errors, head over to Unit 4 and find a github link there. I'll upload an exact example of what I was talking about here so you can compare it with your code and easily troubleshoot.

---

## 04: Concluding

> In case if it was hard for you to follow the guide, or you have any errors, here's an exact example of the Django website I was talking about:

* https://github.com/Swafox/Django-example

(If you still have any questions, feel free to reach me out on Discord. I'll be happy to help.)

> It is also possible to deploy your Django example for free! https://www.pythonanywhere.com/ Has a full support for Django applications with intuitive GUI.

> In case if you enjoyed Django and want to go further, I would recommend these free sources:

* https://tutorial.djangogirls.org/en/
* https://developer.mozilla.org/en-US/docs/Learn/Server-side/Django
* https://docs.djangoproject.com/en/2.2/
* https://djangobook.com/mastering-django-2-book/

---

## 05:  CTF

### Enumeation

#### Nmap

```bash
sudo nmap -sC -sV -oN init 10.10.223.23

[snip]
22/tcp   open  ssh      OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   2048 35:30:91:45:b9:d1:ed:5a:13:42:3e:20:95:6d:c7:b7 (RSA)
|   256 f5:69:6a:7b:c8:ac:89:b5:38:93:50:2f:05:24:22:70 (ECDSA)
|_  256 8f:4d:37:ba:40:12:05:fa:f0:e6:d6:82:fb:65:52:e8 (ED25519)
8000/tcp open  http-alt WSGIServer/0.2 CPython/3.6.9
[snip]
```

* If we go to http://<Machine IP>:8000 we see a Django page with lots of messages about DISALLOWED HOSTS. Rings a bell from the tasks above? We should add the machine IP to the hosts before we can access the app. Let's do that.

### Admin panel flag?

* SSH into machine by given creds:
  
  ```bash
  Username: django-admin
  Password: roottoor1212
  ```

* refered to [Unit-2](#02-getting-started) we know we should change our ALLOWED_HOSTS in the app's `settings.py`

* change this line on `settings.py`:
  
     ```python
     ALLOWED_HOSTS = ['0.0.0.0', '10.10.147.62']
     ```

     ![img](https://i.imgur.com/Zv6Aw6j.png)

* check the page again
  
  ![img](https://i.imgur.com/eGlKhxe.png)

* to read the `admin flag` let's create a admin user account.

* Navigate to /home/django-admin/messagebox/
* Execute the command to create the superuser
     `python3 manage.py createsuperuser`

Follow the prompts to create a username and password and you now have a super user account.

Back on the admin page, you can use those credentials to login.

Once in, navigate through the not so many options and you should see a Users page.

Here's your first flag disguised as the First Name of the user Flag.

### User flag?

* find local user home dir:

     ```bash
     ls -la /home
     cd /home/StrangeFox
     ls
     cat user.txt
     THM{xxx}
     ```

     ![img](https://i.imgur.com/7BRimgd.png)

### Hidden flag?

* run the magic 'Grep'
  
  `grep -Rwi "thm"`

  You Shall find what you're looking for!

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
