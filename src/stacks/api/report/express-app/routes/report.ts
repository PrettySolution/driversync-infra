import {
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  QueryCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { Router } from "express";
import {
  IReport,
  QueryStringParameters,
  REPORT_TABLE_NAME,
} from "../interfaces";

const reportRouter = Router();
const ddbClient = new DynamoDBClient();

reportRouter
  .route("/")
  .get(async (req, res) => {
    const limit = 2;
    const query: QueryStringParameters = req.query;
    try {
      const command = new QueryCommand({
        TableName: process.env[REPORT_TABLE_NAME],
        KeyConditionExpression: "ownerId = :ownerValue",
        ExpressionAttributeValues: {
          ":ownerValue": { S: req.requestContext.authorizer.lambda.user },
        },
        Limit: limit,
        ExclusiveStartKey: query.LastEvaluatedKey
          ? marshall({
              ownerId: req.requestContext.authorizer.lambda.user,
              timestamp: query.LastEvaluatedKey,
            })
          : undefined,
      });
      const data = await ddbClient.send(command);
      let lastEvaluatedKey;
      if (data.LastEvaluatedKey) {
        const lastItem = unmarshall(data.LastEvaluatedKey) as IReport;
        lastEvaluatedKey = lastItem.timestamp;
      }
      let items: IReport[] = [];
      if (data.Items) {
        data.Items.forEach((i) => items.push(unmarshall(i) as IReport));
      }
      res.json({
        items: items,
        limit,
        lastEvaluatedKey,
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
      res.json({ msg: "OK", lastEvaluatedKey: report.timestamp });
    } catch (e) {
      console.error(e);
      res.sendStatus(500);
    }
  });

reportRouter
  .route("/:timestamp")
  .get(async (req, res) => {
    try {
      const command = new GetItemCommand({
        TableName: process.env[REPORT_TABLE_NAME],
        Key: marshall({
          ownerId: req.requestContext.authorizer.lambda.user,
          timestamp: req.params.timestamp,
        }),
      });
      const data = await ddbClient.send(command);
      res.json(data.Item);
    } catch (e) {
      console.log(e);
      res.sendStatus(500);
    }
  })
  .patch(async (req, res) => {
    try {
      const command = new UpdateItemCommand({
        TableName: process.env[REPORT_TABLE_NAME],
        Key: marshall({
          ownerId: req.requestContext.authorizer.lambda.user,
          timestamp: req.params.timestamp,
        }),
        UpdateExpression: "SET #type = :typeValue",
        ExpressionAttributeNames: { "#type": "type" },
        ExpressionAttributeValues: { ":typeValue": { S: req.body.type } },
        ReturnValues: "ALL_NEW",
      });
      const data = await ddbClient.send(command);
      res.json(data.Attributes);
    } catch (e) {
      console.log(e);
      res.sendStatus(500);
    }
  })
  .delete(async (req, res) => {
    try {
      const command = new DeleteItemCommand({
        TableName: process.env[REPORT_TABLE_NAME],
        Key: marshall({
          ownerId: req.requestContext.authorizer.lambda.user,
          timestamp: req.params.timestamp,
        }),
      });
      const data = await ddbClient.send(command);
      res.json(data);
    } catch (e) {
      console.log(e);
      res.sendStatus(500);
    }
  });

reportRouter.param("timestamp", (_req, _res, next, timestamp: string) => {
  // req.report = Reports[timestamp];
  console.debug("run timestamp middleware here", timestamp);
  next();
});

export { reportRouter };
