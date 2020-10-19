import time
import boto3
import os 
rds = boto3.client('rds')
data={}
print("[INFO]", "Initialize function")
def lambda_handler(event, context):
    client = boto3.client('secretsmanager')
    response = client.get_secret_value(
    SecretId=os.environ['passwdarn'],
    )
    print (response)