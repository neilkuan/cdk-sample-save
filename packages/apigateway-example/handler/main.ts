// eslint-disable-next-line import/no-extraneous-dependencies
import * as AWSLambda from 'aws-lambda';

export async function handler(event: AWSLambda.APIGatewayProxyEvent): Promise<AWSLambda.APIGatewayProxyResult> {
  console.log('Event: %j', event);

  const responses: AWSLambda.APIGatewayProxyResult ={
    statusCode: 200,
    body: event.body ? `${event.body}` : `Hello World ${event.httpMethod} method`,
  };
  return responses;
}