#!/bin/bash
set -xe
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1
yum update -y 
yum install docker -y
usermod -aG docker ec2-user
chkconfig docker on
service docker start

docker run -d -p 443:443 -p 80:80 guanyebo/test-web:v3

exit 0 