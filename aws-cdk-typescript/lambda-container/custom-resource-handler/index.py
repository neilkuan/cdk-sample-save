import boto3, json


def get_json(input):
  imageConfig = {
    'EntryPoint': None,
    'Command': None,
    'WorkingDirectory': None
  }

  for i in 'EntryPoint', 'Command':
      try:
          imageConfig[i] = input[i].split(',')
      except:
        pass
  try: 
      imageConfig['WorkingDirectory'] = input['WorkingDirectory']
  except:
    pass

  try: 
      imageConfig['WorkingDirectory'] = input['WorkingDirectory']
  except:
    pass


  try:
    for key, value in list(imageConfig.items()):
        if value is None:
            del imageConfig[key]
        elif value[0] is None:
            del imageConfig[key]
  except:
    pass

  return imageConfig

def on_event(event, context):
    print(event)
    request_type = event["RequestType"]
    if request_type == "Create":
        return on_create(event)
    if request_type == "Update":
        return on_update(event)
    if request_type == "Delete":
        return on_delete(event)
    raise Exception("Invalid request type: %s" % request_type)
def on_create(event):
    props = event["ResourceProperties"]
    client = boto3.client('lambda')
    client.update_function_configuration(
      FunctionName= props['lambdaContainerFunctionName'],
      ImageConfig=get_json(props)
    )
    output = {'Status': 'Created'}
    return {"Data": output}

def on_update(event):
    props = event["ResourceProperties"]
    client = boto3.client('lambda')
    client.update_function_configuration(
      FunctionName= props['lambdaContainerFunctionName'],
      ImageConfig=get_json(props)
    )
    output = {'Status': 'Updated'}
    return {"Data": output}

def on_delete(event):
    props = event["ResourceProperties"]
    print("create new resource with props %s" % props)
    output = {'Status': 'success'}
    
    print(output)
    return {"Data": output}