import boto3
import os

def lambda_handler(event ,context):
    print ("start to work")
    s3 = boto3.resource('s3')
    bucket = s3.Bucket(os.environ['s3bucketname'])
    for key in bucket.objects.all():
      print (key)
