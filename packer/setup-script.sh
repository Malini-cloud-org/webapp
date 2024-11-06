#!/bin/bash
set -e
set -x

# Change to a safe directory
cd /

# Update system packages
sudo apt-get update -y
sudo apt-get upgrade -y
sudo apt-get install -y unzip curl

# Download and install Node.js version 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

#Verify installations
sudo node -v
sudo npm -v
