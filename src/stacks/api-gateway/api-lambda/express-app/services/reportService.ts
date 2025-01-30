import {
  DeleteItemCommand,
  GetItemCommand,
  QueryCommand,
  UpdateItemCommand,
  UpdateItemCommandInput,
} from '@aws-sdk/client-dynamodb';
import { TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { nanoid } from 'nanoid';
import ddbClient, { docClient } from '../config/dynamoDB';
import { Report, ReportProps, tableName } from '../models/reportModel';


export interface IGetAllReportsWithPagination {
  ownerId: string;
  limit: number;
  lastEvaluatedKey?: string;
}

class ReportService {
  private readonly tableName: string | undefined = tableName;

  // Create a new report
  async createReport(props: ReportProps): Promise<Report> {

    const id = nanoid();
    const timestamp = Date.now();

    const report: Report = {
      reportId: id,
      vehicleId: props.vehicleId,
      driverId: props.username,
      checklist: { oil: 0, brake: 1, tair: 2 },
      timestamp,
    };

    const reportId = `REPORT#${id}`;
    const driverId = `DRIVER#${report.driverId}`;
    const vehicleId = `VEHICLE#${report.vehicleId}`;

    const reportItem = {
      pk: reportId,
      sk: `#${timestamp}#${vehicleId}#${driverId}&${reportId}`,
      gsi1pk: 'REPORTS$',
      data: report.checklist,
    };
    const reportsOfDriverItem = {
      pk: reportId,
      sk: `${driverId}#${timestamp}&${reportId}`,
      gsi1pk: 'REPORTS|DRIVER$',
    };
    const reportsOfVehicleItem = {
      pk: reportId,
      sk: `${vehicleId}#${timestamp}&${reportId}`,
      gsi1pk: 'REPORTS|VEHICLE$',
    };
    const items = [reportItem, reportsOfDriverItem, reportsOfVehicleItem];

    try {
      const cmd = new TransactWriteCommand({
        TransactItems: items.map(item => ({
          Put: { TableName: this.tableName, Item: item },
        })),
      });
      await docClient.send(cmd);
      console.log(JSON.stringify(report));

      return report;

    } catch (error) {
      console.error('Error inserting report: ', error);
      throw new Error('Failed to create report');
    }
  }

  // Get a report by timestamp
  async getReport(
    ownerId: string,
    timestamp: string,
  ): Promise<Report | null> {
    try {
      const params = {
        TableName: this.tableName,
        Key: marshall({ ownerId, timestamp }),
      };

      const command = new GetItemCommand(params);
      const data = await ddbClient.send(command);

      // Unmarshall the returned attributes
      if (data.Item) {
        return unmarshall(data.Item) as Report; // Unmarshall and cast to Report
      }

      return null;
    } catch (error) {
      console.error('Error fetching report: ', error);
      throw new Error('Failed to get report');
    }
  }

  // Update the report's type
  async updateReport(
    ownerId: string,
    timestamp: string,
    type: string,
  ): Promise<Report | null> {
    try {
      const params: UpdateItemCommandInput = {
        TableName: this.tableName,
        Key: marshall({ ownerId, timestamp }),
        UpdateExpression: 'SET #type = :typeValue',
        ExpressionAttributeNames: { '#type': 'type' },
        ExpressionAttributeValues: { ':typeValue': { S: type } },
        ReturnValues: 'ALL_NEW',
      };

      const command = new UpdateItemCommand(params);
      const data = await ddbClient.send(command);

      // Unmarshall the returned attributes
      if (data.Attributes) {
        return unmarshall(data.Attributes) as Report; // Unmarshall and cast to Report
      }

      return null;
    } catch (error) {
      console.error('Error updating report: ', error);
      throw new Error('Failed to update report');
    }
  }

  // Delete a report by timestamp
  async deleteReport(ownerId: string, timestamp: string): Promise<void> {
    try {
      const params = {
        TableName: this.tableName,
        Key: marshall({ ownerId, timestamp }),
      };

      const command = new DeleteItemCommand(params);
      await ddbClient.send(command);
    } catch (error) {
      console.error('Error deleting report: ', error);
      throw new Error('Failed to delete report');
    }
  }

  // Get all reports for a given ownerId with pagination
  async getAllReportsWithPagination({
    ownerId,
    limit = 2,
    lastEvaluatedKey,
  }: IGetAllReportsWithPagination): Promise<{
      items: Report[];
      lastEvaluatedKey?: string;
    }> {
    try {
      const params = {
        TableName: this.tableName,
        KeyConditionExpression: 'ownerId = :ownerValue',
        ExpressionAttributeValues: {
          ':ownerValue': { S: ownerId },
        },
        Limit: limit,
        ExclusiveStartKey: lastEvaluatedKey
          ? marshall({
            ownerId,
            timestamp: lastEvaluatedKey,
          })
          : undefined,
      };

      const command = new QueryCommand(params);
      const data = await ddbClient.send(command);

      // Extract LastEvaluatedKey if it exists
      let newLastEvaluatedKey: string | undefined;
      if (data.LastEvaluatedKey) {
        const lastItem = unmarshall(data.LastEvaluatedKey) as any;
        newLastEvaluatedKey = lastItem.timestamp;
      }

      // Convert items from DynamoDB response to usable format
      const items: Report[] = [];
      if (data.Items) {
        data.Items.forEach((i: any) =>
          items.push(unmarshall(i) as Report),
        );
      }

      return {
        items,
        lastEvaluatedKey: newLastEvaluatedKey,
      };
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw new Error('Unable to fetch reports');
    }
  }
}

export default new ReportService();
