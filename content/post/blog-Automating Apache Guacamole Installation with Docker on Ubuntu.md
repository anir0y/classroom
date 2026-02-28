---
title: Blog Automating Apache Guacamole Installation With Docker on Ubuntu
date: 2024-08-13T11:11:42+05:30
lastmod: 2024-08-13T11:11:42+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
cover:
  image: /img/ApacheGuacamole.png
  alt: "cover image"
simg: /img/ApacheGuacamole.png

categories:
  - Tutorials
tags:
  - Apache
  - Guacamole
  - Docker

draft: false
description: Automating Apache Guacamole Installation with Docker on Ubuntu. Apache Guacamole is a clientless remote desktop gateway that supports standard protocols like VNC, RDP, and SSH. Setting it up as a Docker container on Ubuntu can be a breeze with the right script. In this guide, we'll walk you through creating a bash script that automates the entire process, including checks for existing installations, and provides easy access to credentials.

---



# Automating Apache Guacamole Installation with Docker on Ubuntu

Apache Guacamole is a clientless remote desktop gateway that supports standard protocols like VNC, RDP, and SSH. Setting it up as a Docker container on Ubuntu can be a breeze with the right script. In this guide, we'll walk you through creating a bash script that automates the entire process, including checks for existing installations, and provides easy access to credentials.

## Prerequisites

Before you begin, ensure your Ubuntu system is updated.

```bash
sudo apt-get update -y
sudo apt-get upgrade -y
```

## The Script

Here’s a bash script that:

- Installs Docker and Docker Compose if they're not already installed.
- Sets up Apache Guacamole using Docker Compose.
- Checks if Guacamole services are already running, restarts them if they are, and starts them if not.
- Prints out credentials for easy access.

<script src="https://gist.github.com/anir0y/ffe3b8b18c281ef829082ae0693420ca.js"></script>

### Customizing the Script

Replace the placeholder values in the script (`some_password`, `guacamole_db`, `guacamole_user`, `guacamole_password`) with your preferred credentials.

### Running the Script (assuming you're running this as root)

1. Save the script to a file, e.g., `install_guacamole.sh`.
2. Make the script executable:
   ```bash
   chmod +x install_guacamole.sh
   ```
3. Run the script:
   ```bash
   ./install_guacamole.sh
   ```

## Conclusion

This script automates the installation and setup of Apache Guacamole as a Docker container on Ubuntu, ensuring you have a running instance with minimal manual intervention. Enjoy your new remote desktop gateway!