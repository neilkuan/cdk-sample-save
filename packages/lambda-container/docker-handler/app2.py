import json
import logging
import os
import subprocess
import time

arg=os.environ['ARG']

def echo():
  cmd = [ 'echo', 'Hello from Lambda Image Runtime' ]
  output = subprocess.check_output(cmd, env=arg,stderr=subprocess.STDOUT)
  return output

def lambda_handler(event, context):
    "Sample pure Lambda function"

    return  echo().decode('utf-8')[1:-1]