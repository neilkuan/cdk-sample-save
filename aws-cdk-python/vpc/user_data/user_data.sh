#!/bin/bash
yum update -y 
yum install httpd -y
chkconfig httpd on
service httpd start
