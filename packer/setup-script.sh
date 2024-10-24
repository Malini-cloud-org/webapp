#!/bin/bash
set -e
set -x

# Change to a safe directory
cd /

# Update system packages
sudo apt-get update -y
sudo apt-get upgrade -y
sudo apt-get install -y unzip

#Install node and npm
sudo apt-get install -y nodejs npm

#Verify installations
sudo node -v
sudo npm -v
