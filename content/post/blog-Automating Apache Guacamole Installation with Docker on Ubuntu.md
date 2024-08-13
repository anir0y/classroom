---
title: Blog Automating Apache Guacamole Installation With Docker on Ubuntu
date: 2024-08-13T11:11:42+05:30
lastmod: 2024-08-13T11:11:42+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
cover: /img/ApacheGuacamole.png # for tryhackMe
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

```bash
#!/bin/bash

# Step 1: Update System Packages
echo "Updating system packages..."
sudo apt-get update -y

# Step 2: Check if Docker is installed
if ! command -v docker &> /dev/null
then
    echo "Docker not found, installing..."
    sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
    sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
    sudo apt-get update -y
    sudo apt-get install -y docker-ce
else
    echo "Docker is already installed."
fi

# Step 3: Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null
then
    echo "Docker Compose not found, installing..."
    sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
else
    echo "Docker Compose is already installed."
fi

# Step 4: Create a Docker Compose File for Guacamole
echo "Creating Docker Compose file for Guacamole..."
cat <<EOF > docker-compose.yml
version: '3'

services:
  guacamole:
    image: guacamole/guacamole
    ports:
      - "80:8080"
    links:
      - guacd
      - mysql
    depends_on:
      - guacd
      - mysql

  guacd:
    image: guacamole/guacd

  mysql:
    image: mysql:5.7
    environment:
      MYSQL_ROOT_PASSWORD: some_password
      MYSQL_DATABASE: guacamole_db
      MYSQL_USER: guacamole_user
      MYSQL_PASSWORD: guacamole_password
EOF

# Step 5: Check if Guacamole Docker container is already running
if [ "$(sudo docker ps -q -f name=guacamole)" ]; then
    echo "Guacamole Docker container is running, restarting..."
    sudo docker-compose down
    sudo docker-compose up -d
else
    echo "Starting Guacamole services..."
    sudo docker-compose up -d
fi

# Step 6: Verify Installation
echo "Verifying Guacamole services..."
sudo docker ps

# Step 7: Print Credentials
echo "Apache Guacamole should be running. Access it at http://<Your-IP>:8080"
echo "MySQL Root Password: some_password"
echo "MySQL Database: guacamole_db"
echo "MySQL User: guacamole_user"
echo "MySQL User Password: guacamole_password"
```

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
