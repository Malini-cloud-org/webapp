#!/bin/bash
set -e  # Exit on any error 
set -x  # Print commands for debugging 

sudo mkdir -p /opt/webapp

# Create the group if it doesn't already exist
if ! getent group csye6225 > /dev/null 2>&1; then
  sudo groupadd csye6225
  echo "Group csye6225 created."
else
  echo "Group csye6225 already exists."
fi

# Create the user if it doesn't already exist
if ! id -u csye6225 > /dev/null 2>&1; then
  sudo useradd -r -g csye6225 -s /usr/sbin/nologin csye6225
  echo "User csye6225 created."
else
  echo "User csye6225 already exists."
fi
# sudo groupadd csye6225
# sudo adduser csye6225 --shell /usr/sbin/nologin -g csye6225
sudo chown -R csye6225:csye6225 /opt/webapp
sudo cp /tmp/csye6225-aws.service  /etc/systemd/system/

# sudo cp /tmp/webapp.zip /opt/
# sudo unzip /opt/webapp.zip -d /opt/webapp

sudo unzip /tmp/webapp.zip -d /opt/webapp/
echo "Unzipped structure:"
ls -R /opt/webapp/



# Navigate to the service directory and set environment variables
if [ -d "/opt/webapp/service" ]; then
  cd /opt/webapp/service || exit
elif [ -d "/opt/webapp/webapp/service" ]; then
  cd /opt/webapp/webapp/service || exit
else
  echo "Directory /opt/webapp/service not found!"
  exit 1
fi
# cd /opt/webapp/service  || exit

env_values=$(cat <<END
PORT=$PORT
DB_NAME=$DB_NAME
DB_USERNAME=$DB_USERNAME
DB_PASSWORD=$DB_PASSWORD
DB_HOST=$DB_HOST
DB_DIALECT=$DB_DIALECT
END
)

echo "$env_values" | sudo tee .env >/dev/null
sudo chown csye6225:csye6225 .env 

echo ".env file created"

sudo npm install 

echo "NPM packages installed successfully."


sudo systemctl daemon-reload
sudo systemctl enable csye6225-aws.service
