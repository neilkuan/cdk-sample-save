import json
import logging
import os
import subprocess
import time

import sys
def handler(event, context): 
    return 'Hello from AWS Lambda using Python App 2 ' + sys.version + '!'