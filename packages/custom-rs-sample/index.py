import boto3
import time

ec2 = boto3.client('ec2')

def on_event(event):
    print(event)
    request_type = event['RequestType']
    if request_type == 'Create': return on_create(event)
    if request_type == 'Update': return on_update(event)
    if request_type == 'Delete': return on_delete(event)
    raise Exception(f'Invalid request type: {request_type}')

def on_create(event):
    props = event['ResourceProperties']
    security_group_id = props['SGId']
    my_ip = props['myIp']
    print(f'create new resource with props {props}')
    ec2.authorize_security_group_ingress(
                    GroupId=security_group_id,
                    IpPermissions=[{'IpProtocol': 'tcp','FromPort': 22,'ToPort': 22,'IpRanges': [{'CidrIp': my_ip + '/32'}]}])
    data = {'RES': f'{my_ip} is already add 22 '}
    return { 'Data': data }

def on_update(event):
    return on_create(event)

def on_delete(event):
    return

def is_complete(event):
    request_type = event['RequestType']
    if request_type == 'Delete': return { 'IsComplete': True }
    return { 'IsComplete': True }