#!/bin/bash
set -xe
exec > >(tee /var/log/user-data.log | logger -t user-data -s 2>/dev/console) 2>&1
#remove old docker.
sudo apt-get remove docker docker-engine docker.io containerd runc -y

#Update the apt package index:
sudo apt-get update -y

#Install packages to allow apt to use a repository over HTTPS:
sudo apt-get install \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg-agent \
    software-properties-common -y

#Add Docker’s official GPG key:
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo apt-key fingerprint 0EBFCD88

#Use the following command to set up the stable repository. To add the nightly or test repository,
#add the word nightly or test (or both) after the word stable in the commands below. Learn about nightly and test channels.
sudo add-apt-repository \
    "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) \
   stable"

#Update the apt package index.
sudo apt-get update -y

#Install the latest version of Docker Engine - Community and containerd, or go to the next step to install a specific version:
sudo apt-get install docker-ce docker-ce-cli containerd.io -y

#start docker services
sudo systemctl start docker
sudo systemctl enable docker

sudo snap install amazon-ssm-agent --classic
sudo systemctl start snap.amazon-ssm-agent.amazon-ssm-agent.service
sudo systemctl status snap.amazon-ssm-agent.amazon-ssm-agent.service
exit 0
