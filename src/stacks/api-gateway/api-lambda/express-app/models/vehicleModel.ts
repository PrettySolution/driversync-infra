import { UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { nanoid } from 'nanoid';
import { docClient } from '../config/dynamoDB';

export class VehicleModel {
  private tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  // Create a new vehicle
  async createVehicle(model: string, plate: string, odometer: number): Promise<void> {
    const vehicleId = nanoid();
    const insertParams = {
      TableName: this.tableName,
      Item: {
        pk: `VEHICLE#${vehicleId}`,
        sk: 'METADATA',
        gsi1pk: 'VEHICLES$',
        data: {
          vehicleId,
          status: 'available',
          assignedDriverId: null,
          model,
          plate,
          odometer,
        },
      },
    };

    try {
      const cmd = new PutCommand(insertParams);
      await docClient.send(cmd);
    } catch (error) {
      console.error('Error inserting vehicle: ', error);
      throw new Error('Failed to create vehicle');
    }
  }

  // Get all vehicles
  async listVehicles(): Promise<any[] | undefined> {
    const params = {
      TableName: this.tableName,
      IndexName: 'gsi1pk-sk-index',
      KeyConditionExpression: 'gsi1pk = :vehiclePrefix',
      ExpressionAttributeValues: {
        ':vehiclePrefix': 'VEHICLES$',
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

  // Assign a vehicle to a driver
  async assignVehicleToDriver(vehicleId: string, driverId: string): Promise<void> {
    try {
      // Update the vehicle record
      const updateVehicleParams = {
        TableName: this.tableName,
        Key: marshall({
          pk: `VEHICLE#${vehicleId}`,
          sk: 'METADATA',
        }),
        UpdateExpression: 'SET #data.#status = :assigned, #data.#assignedDriverId = :driverId',
        ExpressionAttributeNames: {
          '#data': 'data',
          '#status': 'status',
          '#assignedDriverId': 'assignedDriverId',
        },
        ExpressionAttributeValues: marshall({
          ':assigned': 'assigned',
          ':driverId': driverId,
        }),
      };

      const vehicleCommand = new UpdateItemCommand(updateVehicleParams);
      await docClient.send(vehicleCommand);

      // Update the driver record
      const updateDriverParams = {
        TableName: this.tableName,
        Key: marshall({
          pk: `DRIVER#${driverId}`,
          sk: 'DRIVER#',
        }),
        UpdateExpression: 'SET #data.#assignedVehicleId = :vehicleId',
        ExpressionAttributeNames: {
          '#data': 'data',
          '#assignedVehicleId': 'assignedVehicleId',
        },
        ExpressionAttributeValues: marshall({
          ':vehicleId': vehicleId,
        }),
      };

      const driverCommand = new UpdateItemCommand(updateDriverParams);
      await docClient.send(driverCommand);
    } catch (error) {
      console.error('Error assigning vehicle to driver:', error);
      throw error;
    }
  }
}