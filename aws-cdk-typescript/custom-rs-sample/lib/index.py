import boto3, time

ec2 = boto3.client('ec2')

def on_event(event, context):
  print(event)
  request_type = event['RequestType']
  if request_type == 'Create': return on_create(event)
  if request_type == 'Update': return on_update(event)
  if request_type == 'Delete': return on_delete(event)
  raise Exception("Invalid request type: %s" % request_type)

def on_create(event):
  props = event["ResourceProperties"]
  security_group_id = props['SGId']
  my_ip = props['myIp']
  print("create new resource with props %s" % props)
  ec2.authorize_security_group_ingress(
                    GroupId=security_group_id,
                    IpPermissions=[{'IpProtocol': 'tcp','FromPort': 22,'ToPort': 22,'IpRanges': [{'CidrIp': my_ip + "/32"}]}])
  data = {'RES': '{my_ip} is already add 22 '.format(my_ip=my_ip)}
  return { 'Data': data }

def on_update(event):
  return on_create(event)

def on_delete(event):
  return

def is_complete(event, context):
  request_type = event["RequestType"]
  if request_type == 'Delete': return { 'IsComplete': True }
  return { 'IsComplete': True }