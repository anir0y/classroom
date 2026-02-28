---
title: Optimizing Web Application Performance and Security With Azure Front Door and Application Gateway
date: 2023-03-16T22:06:19+05:30
lastmod: 2023-03-16T22:06:19+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
featureimage: img/az-sec-1.png
simg: /img/az-sec-1.png

categories:
  - Blog
tags:
  - azure


draft: false
description: Learn how to optimize the performance and security of your web applications using Azure Front Door and Application Gateway. Our step-by-step guide explains how these services work together and provides tips for configuring them effectively. Discover the benefits of using Front Door and Application Gateway, including load balancing, WAF protection, and SSL encryption. Start improving your web application today!

---

# How to configure Azure Front Door with Application Gateway

Azure Front Door and Application Gateway are two services that can help you improve the performance and security of your web applications. In this post, we will explain what they are, how they work together, and how to configure them step by step.

## What is Azure Front Door?

Azure Front Door is an Application Delivery Network (ADN) as a service, offering various layer 7 load-balancing capabilities for your applications. It provides dynamic site acceleration (DSA) along with global load balancing with near real-time failover. It is a highly available and scalable service, which is fully managed by Azure.

Some of the benefits of using Azure Front Door are:

- It allows you to route traffic to the closest server to the user, reducing latency and improving user experience.
- It supports end-to-end encryption with automated SSL certificate management and custom domains.
- It offers web application firewall (WAF) protection against common web attacks and malicious bots.
- It enables you to define routing rules based on URL path, HTTP method, header values, query parameters, etc.
- It supports session affinity, caching, compression, URL rewriting, health probes, custom error pages, etc.

## What is Azure Application Gateway?

Azure Application Gateway is a web traffic load balancer that manages application content traffic. It operates at layer 7 of the OSI model and supports HTTP(S), WebSocket and HTTP/2 protocols. It also offers WAF functionality with predefined or custom rulesets.

Some of the benefits of using Azure Application Gateway are:

- It allows you to route traffic based on URL path or host name to different backend pools of servers.
- It supports end-to-end encryption with SSL termination at the gateway level or SSL pass-through to the backend servers.
- It offers WAF protection against common web attacks and malicious bots with OWASP core rule sets or custom rules.
- It enables you to configure health probes for backend servers and automatically remove unhealthy ones from rotation.
- It supports session affinity, cookie-based or IP-based, for sticky sessions across backend servers.
- It supports autoscaling based on demand and zone redundancy for high availability.

## How do they work together?

You can use Azure Front Door and Application Gateway together to achieve a multi-layered load balancing solution for your web applications. In this scenario,

Front Door acts as **the global entry point** for your application traffic. 
It routes requests **to the nearest region** where your application is deployed using Anycast protocol. 
It also provides **DSA** features such as caching and compression **to optimize performance**.

Application Gateway acts as **the regional entry point** for your application traffic within each region. 
It routes requests **to different backend pools** based on URL path or host name **to distribute load**. 
It also provides **WAF** features such as rule sets and custom rules **to enhance security**.

The following diagram illustrates this architecture:

![Front Door + Application Gateway Architecture](https://learn.microsoft.com/en-us/samples/azure/azure-quickstart-templates/front-door-standard-premium-application-gateway-public/media/diagram.png)

## How to configure them step by step?

To configure Azure Front Door with Application Gateway,

1. You need to create an Application Gateway instance in each region where your application is deployed. You can use Azure Portal, PowerShell, Azure CLI or ARM templates to do so. Make sure you select the WAF_v2 SKU for your gateway instance.

2. You need to create a WAF policy for each gateway instance that includes a mandatory managed ruleset (such as OWASP core rule set) and a custom rule that inspects the X-Azure-FDID header value. This header value contains the ID of your Front Door profile which will be used later for verification.

3. You need to create backend pools for each gateway instance that contain one or more servers that host your application content. You can use virtual machines (VMs), virtual machine scale sets (VMSS), App Service instances or any other type of server that can serve HTTP(S) requests.

4. You need to create routing rules for each gateway instance that define how requests are routed from listeners (ports) to backend pools based on URL path or host name patterns.

5. You need to create health probes for each gateway instance that monitor the health status of each backend server and remove unhealthy servers from rotation.

You need to configure SSL certificates for each gateway instance to enable end-to-end encryption of your application traffic.

You need to create a Front Door profile that includes one or more Frontend hosts, each associated with a routing rule that maps to a backend pool in a specific gateway instance. You also need to configure SSL certificates for your Front Door profile.

You need to verify ownership of your domain name by adding a DNS record to your domain registrar that points to your Front Door profile.

Finally, you need to test your configuration by sending requests to your application through your Front Door URL and verifying that they are properly load balanced across your gateway instances.

In summary, by configuring Azure Front Door with Application Gateway, you can create a highly available, scalable, and secure multi-layered load balancing solution for your web applications. The steps outlined above provide a general guideline for setting up this architecture, but you should always consult the official documentation and best practices to ensure that you are following the latest recommendations and security guidelines.---