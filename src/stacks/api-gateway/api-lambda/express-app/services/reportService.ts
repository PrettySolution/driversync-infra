import {
  DeleteItemCommand,
  GetItemCommand,
  UpdateItemCommand,
  UpdateItemCommandInput,
} from '@aws-sdk/client-dynamodb';
import { QueryCommand, QueryCommandInput, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { nanoid } from 'nanoid';
import ddbClient, { docClient } from '../config/dynamoDB';
import { Report, tableName } from '../models/reportModel';

/**
 * cursor is timestamp of last item
 * last is the id of last item
 * **/
export interface LastEvaluatedKey {
  cursor?: string;
  last?: string;
}

/**
 * IGetAllReportsWithPagination todo doc
 */
export interface IGetAllReportsWithPagination {
  driverId: string;
  limit: number;
  lastEvaluatedKey: LastEvaluatedKey;
}

export enum REPORTS_GSI1 {
  REPORTS = 'REPORTS$',
  REPORTS_OF_DRIVER = 'REPORTS|DRIVER$',
  REPORTS_OF_VEHICLE = 'REPORTS|VEHICLE$',
}

export enum ENTITIES {
  REPORT = 'REPORT',
  DRIVER = 'DRIVER',
  VEHICLE = 'VEHICLE',
}

class ReportService {
  private readonly tableName: string | undefined = tableName;

  // Create a new report
  async createReport(data: { vehicleId: string; username: string }): Promise<Report> {

    const id = nanoid();
    const timestamp = Date.now();

    const report: Report = {
      reportId: id,
      vehicleId: data.vehicleId,
      driverId: data.username,
      payload: { checklist: { oil: 0, brake: 1, tair: 2 }, note: 'this is a note' },
      createdAt: timestamp,
    };

    const rawReportId = `${ENTITIES.REPORT}#${report.reportId}`;
    const rawDriverId = `${ENTITIES.DRIVER}#${report.driverId}`;
    const rawVehicleId = `${ENTITIES.VEHICLE}#${report.vehicleId}`;

    const rawReportItem = {
      pk: rawReportId,
      sk: `#${timestamp}#${rawVehicleId}#${rawDriverId}&${rawReportId}`,
      gsi1pk: REPORTS_GSI1.REPORTS,
      data: report,
    };
    const rawReportsOfDriverItem = {
      pk: rawReportId,
      sk: `${rawDriverId}#${timestamp}&${rawReportId}`,
      gsi1pk: REPORTS_GSI1.REPORTS_OF_DRIVER,
      data: report,
    };
    const rawReportsOfVehicleItem = {
      pk: rawReportId,
      sk: `${rawVehicleId}#${timestamp}&${rawReportId}`,
      gsi1pk: REPORTS_GSI1.REPORTS_OF_VEHICLE,
      data: report,
    };
    const items = [rawReportItem, rawReportsOfDriverItem, rawReportsOfVehicleItem];

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

  /**
   * Get all reports for a given ownerId with pagination
   * @param driverId is the DRIVER
   * @param limit is a limit between 2 and 10
   * @param lastEvaluatedKey todo doc
   * @param cognitoGroups
   */
  async getAllReportsWithPagination({
    driverId,
    limit = 2,
    lastEvaluatedKey,
  }: IGetAllReportsWithPagination): Promise<{
      items: Report[];
      lastEvaluatedKey: LastEvaluatedKey;
    }> {
    try {

      // If cursor exists we want to set ExclusiveStartKey for infinite scrolling
      let exclusiveStartKey: any | undefined;
      if (lastEvaluatedKey.cursor) {
        exclusiveStartKey = {
          pk: `${ENTITIES.REPORT}#${lastEvaluatedKey.last}`,
          sk: `${ENTITIES.DRIVER}#${driverId}#${lastEvaluatedKey.cursor}&${ENTITIES.REPORT}#${lastEvaluatedKey.last}`,
          gsi1pk: REPORTS_GSI1.REPORTS_OF_DRIVER,
        };
        console.log('exclusiveStartKey: ', exclusiveStartKey);
      }

      const params: QueryCommandInput = {
        TableName: this.tableName,
        IndexName: 'gsi1pk-sk-index',
        Select: 'ALL_ATTRIBUTES',
        KeyConditionExpression: 'gsi1pk = :gsi1pkValue AND begins_with(sk, :skPrefix)',
        ExpressionAttributeValues: {
          ':gsi1pkValue': REPORTS_GSI1.REPORTS_OF_DRIVER,
          ':skPrefix': `${ENTITIES.DRIVER}#${driverId}`,
        },
        Limit: limit,
        ExclusiveStartKey: exclusiveStartKey,
      };

      const command = new QueryCommand(params);
      const data = await docClient.send(command);
      // console.log(JSON.stringify(data, null, 2));

      // update lastEvaluatedKey if there is any. If not leave the old ones
      const newLastEvaluatedKey: LastEvaluatedKey = {};
      if (data.Count && data.Items) {
        const lastItem = data.Items[data.Items.length - 1].data as Report;
        newLastEvaluatedKey.cursor = lastItem.createdAt.toString();
        newLastEvaluatedKey.last = lastItem.reportId;
      }

      // Convert items to usable format
      const items: Report[] = [];
      if (data.Items) {
        data.Items.forEach((i: any) => items.push(i.data as Report));
      }
      return { items, lastEvaluatedKey: newLastEvaluatedKey };

    } catch (error) {
      console.error('Error fetching reports:', error);
      throw new Error('Unable to fetch reports');
    }
  }
}

export default new ReportService();
