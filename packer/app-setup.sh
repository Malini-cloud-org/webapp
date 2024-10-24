#!/bin/bash
set -e  # Exit on any error 
set -x  # Print commands for debugging 

sudo mkdir -p /opt/webapp
sudo groupadd -f csye6225
sudo useradd -r -g csye6225 -s /usr/sbin/nologin csye6225
sudo chown -R csye6225:csye6225 /opt/webapp

sudo cp /tmp/csye6225-aws.service  /etc/systemd/system/

# Ensure webapp.zip exists and copy it to /opt
if [ -f "/tmp/webapp.zip" ]; then
  sudo cp /tmp/webapp.zip /opt/
else
  echo "Error: /tmp/webapp.zip not found!"
  exit 1
fi

sudo unzip /opt/webapp.zip -d /opt/webapp
cd /opt/webapp/service || exit 1

env_values=$(cat <<END
PORT=$PORT
DB_DIALECT=$DB_DIALECT
END
)

echo "$env_values" | sudo tee .env >/dev/null
sudo chown csye6225:csye6225 .env 

echo ".env file created"

echo "PORT is: $PORT"
echo "DB_DIALECT is: $DB_DIALECT"

#Install npm dependencies
sudo npm install 

echo "NPM packages installed successfully."

#Reload SystemD and enable the service
sudo systemctl daemon-reload
sudo systemctl enable csye6225-aws.service
sudo systemctl start csye6225-aws.service
