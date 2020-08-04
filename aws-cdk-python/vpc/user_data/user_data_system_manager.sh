#!/bin/bash
set -xe
exec > >(tee /var/log/user-data.log | logger -t user-data -s 2>/dev/console) 2>&1
yum update -y
yum install docker -y
usermod -aG docker ec2-user
systemctl start docker
systemctl enable docker

docker pull guanyebo/web-test:v5cloud
sleep 3
docker run -d -p 443:443 -p 80:80 guanyebo/web-test:v5cloud

#yum install -y https://s3.amazonaws.com/ec2-downloads-windows/SSMAgent/latest/linux_amd64/amazon-ssm-agent.rpm
systemctl status amazon-ssm-agent
systemctl enable amazon-ssm-agent
systemctl restart amazon-ssm-agent
exit 0
