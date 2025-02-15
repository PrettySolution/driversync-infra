import { GetItemCommand } from "@aws-sdk/client-dynamodb";
import { docClient } from "../config/dynamoDB";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";

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
        sk: `DRIVER_NAME#${name}`,
      })
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
        sk: `DRIVER_NAME#${name}`,
        gsi1pk: 'DRIVERS$',
        data: {
          driverId,
          name,
          assignedVehicleId: null
        }
      }
    };

    try {
      const cmd = new PutCommand(insertParams);
      await docClient.send(cmd);
    } catch (error) {
      console.error('Error inserting driver: ', error);
      throw new Error('Failed to create driver');
    }
  }
}