import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { APIGatewayProxyHandlerV2WithLambdaAuthorizer } from 'aws-lambda';
import { AuthorizerContext, REPORT_TABLE_NAME } from './ReportStack';

const ddbClient = new DynamoDBClient();

export const handler: APIGatewayProxyHandlerV2WithLambdaAuthorizer<AuthorizerContext> = async (event) => {
  const authorizerContext = event.requestContext.authorizer.lambda;
  try {
    const command = new ScanCommand({
      TableName: process.env[REPORT_TABLE_NAME],
      FilterExpression: '#owner = :ownerValue',
      ExpressionAttributeNames: { '#owner': 'owner' },
      ExpressionAttributeValues: { ':ownerValue': { S: authorizerContext.user } },
    });
    const res = await ddbClient.send(command);
    // console.log('res: ', JSON.stringify(res));
    return {
      statusCode: res.$metadata.httpStatusCode,
      body: JSON.stringify(res),
    };
  } catch (e) {
    console.log(e);
    return {
      statusCode: 500,
      body: JSON.stringify(e),
    };
  }
};

// @ts-ignore
void handler(
  {
    queryStringParameters: {
      hello: 'world',
    },
    requestContext: {
      authorizer: {
        lambda: {
          user: 'vasylherman',
        },
      },
    },
  },
);