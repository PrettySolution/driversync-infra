import { DynamoDBClient, PutItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import express from 'express';
import { AuthorizerContext, IReport, QueryStringParameters, REPORT_TABLE_NAME } from './index';

declare global {
  namespace Express {
    interface Request {
      requestContext: { authorizer: { lambda: AuthorizerContext } };
    }
  }
}

const app = express();

app.use(express.json());
app.use((req, _, next) => {
  console.log(req.method, req.originalUrl);
  next();
});

const ddbClient = new DynamoDBClient();

app.route('/api/report/:timestamp')
  .get( async (req, res) => {
    console.log(req.requestContext.authorizer.lambda.user);
    res.send(req.params);
  });

app.route('/api/report')
  .get(async (req, res) => {
    const limit = 2;
    const query: QueryStringParameters = req.query;
    try {
      const command = new QueryCommand({
        TableName: process.env[REPORT_TABLE_NAME],
        KeyConditionExpression: '#owner = :ownerValue',
        ExpressionAttributeNames: { '#owner': 'owner' },
        ExpressionAttributeValues: { ':ownerValue': { S: req.requestContext.authorizer.lambda.user } },
        Limit: limit,
        ExclusiveStartKey: query.LastEvaluatedKey ? marshall({
          owner: req.requestContext.authorizer.lambda.user,
          timestamp: query.LastEvaluatedKey,
        }) : undefined,
      });
      const data = await ddbClient.send(command);
      let lastEvaluatedKey;
      if (data.LastEvaluatedKey) {
        const lastItem = unmarshall(data.LastEvaluatedKey) as IReport;
        lastEvaluatedKey = lastItem.timestamp;
      }
      let items: IReport[] = [];
      if (data.Items) {
        data.Items.forEach(i => items.push(unmarshall(i) as IReport));
      }
      res.status(data.$metadata.httpStatusCode!).send({
        items: items, limit, lastEvaluatedKey,
      });
    } catch (e) {
      console.log(e);
      res.sendStatus(500);
    }
  })
  .put(async (req, res) => {
    const report: IReport = {
      timestamp: Date.now().toString(),
      owner: req.requestContext.authorizer.lambda.user,
      type: req.body.type,
    };
    try {
      const command = new PutItemCommand({
        TableName: process.env[REPORT_TABLE_NAME],
        Item: marshall(report),
      });
      const data = await ddbClient.send(command);
      res.status(data.$metadata.httpStatusCode!).send({ msg: 'OK', lastEvaluatedKey: report.timestamp });
    } catch (e) {
      console.error(e);
      res.sendStatus(500);
    }
  });

app.route('/api/report/debug')
  .all((req, res) => {
    res.send({
      body: req.body,
      query: req.query,
      authorizerContext: req.requestContext.authorizer.lambda,
    });
  });

// Export the app for serverless-http
export default app;