import json
import datetime

def refund_handler(message, context):
    
    # Input Example
    # { 'TransactionType': 'REFUND' }
    
    # log input message
    print("Received message from step Function.")
    print(message)
    
    # Construct response object.
    response = {}
    response['TransactionType'] = message['TransactionType']
    response['Timestamp'] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    response['Message'] = 'Hello from lambda land inside the ProcessRefund function.'
    
    return response

def purchase_handler(message, context):
    
    # Input Example
    # { 'TransactionType': 'PURCHASE' }
    
    # log input message
    print("Received message from step Function.")
    print(message)
    
    # Construct response object.
    response = {}
    response['TransactionType'] = message['TransactionType']
    response['Timestamp'] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    response['Message'] = 'Hello from lambda land inside the ProcessPurchase function.'
    
    return response