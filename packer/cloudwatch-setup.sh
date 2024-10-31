#!/bin/bash
set -e
set -x

# Update the package manager
sudo apt-get update -y

# Download and Install the CloudWatch Agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i ./amazon-cloudwatch-agent.deb

echo "Cloud watch agent succesfully downloaded" 

# Enable the CloudWatch agent to start on boot
sudo systemctl enable amazon-cloudwatch-agent
sudo systemctl start amazon-cloudwatch-agent

# Create log directory
sudo mkdir -p /opt/webapp/logs
sudo chown -R csye6225:csye6225 /opt/webapp/logs

echo "log file directory created"

#Configure cloudwatch agent
sudo mv /tmp/cloudwatch-config.json /opt/cloudwatch_config.json
sudo chmod 775 /opt/cloudwatch_config.json
sudo chown -R csye6225:csye6225 /opt/cloudwatch_config.json

sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/cloudwatch_config.json -s
sudo systemctl restart amazon-cloudwatch-agent

