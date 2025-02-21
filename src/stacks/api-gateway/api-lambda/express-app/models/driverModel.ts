import { GetItemCommand } from '@aws-sdk/client-dynamodb';
import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { docClient } from '../config/dynamoDB';

export class DriverModel {
  private tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  async createDriver(driverId: string, name: string): Promise<void> {
    const checkParams = {
      TableName: this.tableName,
      Key: marshall({
        pk: `DRIVER#${driverId}`,
        sk: `DRIVER#${name}`,
      }),
    };

    const command = new GetItemCommand(checkParams);
    const existingUser = await docClient.send(command);

    if (existingUser.Item) {
      throw new Error('User already exists');
    }

    const insertParams = {
      TableName: this.tableName,
      Item: {
        pk: `DRIVER#${driverId}`,
        sk: `DRIVER#${name}`,
        gsi1pk: 'DRIVERS$',
        data: {
          driverId,
          name,
          assignedVehicleId: '',
        },
      },
    };

    try {
      const cmd = new PutCommand(insertParams);
      await docClient.send(cmd);
    } catch (error) {
      console.error('Error inserting driver: ', error);
      throw new Error('Failed to create driver');
    }
  }

  async listDrivers(): Promise<any[] | undefined> {
    const params = {
      TableName: this.tableName,
      IndexName: 'gsi1pk-sk-index',
      KeyConditionExpression: 'gsi1pk = :driverPrefix',
      ExpressionAttributeValues: {
        ':driverPrefix': 'DRIVERS$',
      },
    };

    try {
      const command = new QueryCommand(params);
      const data = await docClient.send(command);
      return data.Items?.map(item => item.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw new Error('Unable to fetch reports');
    }
  }
}