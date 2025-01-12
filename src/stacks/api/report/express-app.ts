import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  QueryCommand,
  UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';
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
    try {
      const command = new GetItemCommand({
        TableName: process.env[REPORT_TABLE_NAME],
        Key: marshall({
          ownerId: req.requestContext.authorizer.lambda.user,
          timestamp: req.params.timestamp,
        }),
      });
      const data = await ddbClient.send(command);
      res.send(data.Item);
    } catch (e) {
      console.log(e);
      res.sendStatus(500);
    }
  })
  .patch(async (req, res) => {
    console.log(req.body.type);
    try {
      const command = new UpdateItemCommand({
        TableName: process.env[REPORT_TABLE_NAME],
        Key: marshall({
          ownerId: req.requestContext.authorizer.lambda.user,
          timestamp: req.params.timestamp,
        }),
        UpdateExpression: 'SET #type = :typeValue',
        ExpressionAttributeNames: { '#type': 'type' },
        ExpressionAttributeValues: { ':typeValue': { S: req.body.type } },
        ReturnValues: 'ALL_NEW',
      });
      const data = await ddbClient.send(command);
      res.send(data.Attributes);
    } catch (e) {
      console.log(e);
      res.sendStatus(500);
    }
  });

app.route('/api/report')
  .get(async (req, res) => {
    const limit = 2;
    const query: QueryStringParameters = req.query;
    try {
      const command = new QueryCommand({
        TableName: process.env[REPORT_TABLE_NAME],
        KeyConditionExpression: 'ownerId = :ownerValue',
        ExpressionAttributeValues: { ':ownerValue': { S: req.requestContext.authorizer.lambda.user } },
        Limit: limit,
        ExclusiveStartKey: query.LastEvaluatedKey ? marshall({
          ownerId: req.requestContext.authorizer.lambda.user,
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
      res.send({
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
      ownerId: req.requestContext.authorizer.lambda.user,
      type: req.body.type,
    };
    try {
      const command = new PutItemCommand({
        TableName: process.env[REPORT_TABLE_NAME],
        Item: marshall(report),
      });
      await ddbClient.send(command);
      res.send({ msg: 'OK', lastEvaluatedKey: report.timestamp });
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