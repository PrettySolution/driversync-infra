import { DynamoDBClient, PutItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthorizerContext, IReport, QueryStringParameters, REPORT_TABLE_NAME } from './index';

const app = express();

// Middleware to parse JSON
app.use(express.json());
const ddbClient = new DynamoDBClient();

// GET Report
app.get('/api/report', async (req, res) => {
  console.log(req.method, req.originalUrl);
  // @ts-ignore
  const authorizerContext: AuthorizerContext = req.requestContext.authorizer.lambda;
  const limit = 5;
  try {
    const command = new ScanCommand({
      TableName: process.env[REPORT_TABLE_NAME],
      FilterExpression: '#owner = :ownerValue',
      ExpressionAttributeNames: { '#owner': 'owner' },
      ExpressionAttributeValues: { ':ownerValue': { S: authorizerContext.user } },
      Limit: limit,
    });
    const data = await ddbClient.send(command);
    res.status(data.$metadata.httpStatusCode!).send({
      body: data, limit,
    });
  } catch (e) {
    console.log(e);
    res.status(500).send({ msg: 'error' });
  }
});

// PUT Report
app.put('/api/report', async (req, res) => {
  console.log(req.method, req.originalUrl);
  // @ts-ignore
  const authorizerContext: AuthorizerContext = req.requestContext.authorizer.lambda;
  const report: IReport = {
    id: uuidv4(),
    owner: authorizerContext.user,
    type: req.body.type,
  };
  try {
    const command = new PutItemCommand({
      TableName: process.env[REPORT_TABLE_NAME],
      Item: marshall(report),
    });
    const data = await ddbClient.send(command);
    res.status(data.$metadata.httpStatusCode!).send({ body: JSON.stringify(data) });
  } catch (e) {
    console.error(e);
    res.status(500).send({ msg: 'error' });
  }
});


app.all('/api/report/debug', (req, res) => {
  console.log(req.method, req.originalUrl);
  const body: QueryStringParameters = req.body;
  // @ts-ignore
  const authorizerContext: AuthorizerContext = req.requestContext.authorizer.lambda;
  // @ts-ignore
  const query: QueryStringParameters = req.query;

  const data = {
    body,
    authorizerContext,
    query,
  };
  res.send(data);
});

// Export the app for serverless-http
export default app;