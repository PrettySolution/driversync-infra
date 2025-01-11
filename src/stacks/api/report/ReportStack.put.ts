import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { APIGatewayProxyHandlerV2WithLambdaAuthorizer } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { AuthorizerContext, IReport, REPORT_TABLE_NAME } from './ReportStack';

const ddbClient = new DynamoDBClient();

export const handler: APIGatewayProxyHandlerV2WithLambdaAuthorizer<AuthorizerContext> = async (event) => {
  const authorizerContext = event.requestContext.authorizer.lambda;
  const report: IReport = {
    id: uuidv4(),
    owner: authorizerContext.user,
    type: JSON.parse(event.body!).type,
  };
  const command = new PutItemCommand({
    TableName: process.env[REPORT_TABLE_NAME],
    Item: marshall(report),
  });
  try {
    const res = await ddbClient.send(command);
    console.log(res);
    return {
      statusCode: 200,
      body: JSON.stringify(res),
    };
  } catch (e) {
    console.error(e);
    return {
      statusCode: 500,
      body: JSON.stringify({ e }),
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
    body: '{"type":"default"}',
  },
);