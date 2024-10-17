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

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Enable and start PostgreSQL service
sudo systemctl daemon-reload
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Configure PostgreSQL: create user and database using environment variables
sudo -u postgres psql <<EOF
CREATE USER $DB_USERNAME WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE $DB_NAME;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USERNAME;
ALTER DATABASE $DB_NAME OWNER TO $DB_USERNAME;
EOF