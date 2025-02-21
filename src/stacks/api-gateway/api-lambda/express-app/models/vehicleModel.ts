import { GetItemCommand, TransactWriteItem, TransactWriteItemsCommand, TransactWriteItemsCommandInput, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
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
          assignedDriverId: '',
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
  
  // Assign a vehicle to a driver using transactions, including releasing the previous vehicle
  async assignVehicleToDriver(vehicleId: string, driverId: string, driverName: string): Promise<void> {
    try {
      // Step 1: Retrieve the current driver's assigned vehicle ID (if any)
      const getDriverParams = {
        TableName: this.tableName,
        Key: marshall({
          pk: `DRIVER#${driverId}`,
          sk: `DRIVER#${driverName}`,
        }),
        ProjectionExpression: '#data.#assignedVehicleId',
        ExpressionAttributeNames: {
          '#data': 'data',
          '#assignedVehicleId': 'assignedVehicleId',
        },
      };
      const getDriverCommand = new GetItemCommand(getDriverParams);
      const driverResponse = await docClient.send(getDriverCommand);

      let previousVehicleId: string | undefined = undefined;

      if (driverResponse.Item) {
        const unmarshalledItem = unmarshall(driverResponse.Item);
        previousVehicleId = unmarshalledItem.data?.assignedVehicleId;
      }

      // Step 2: Define the transaction items
      const transactionItems: TransactWriteItem[] = [];

      // Step 3: If there's a previous vehicle, release it
      if (previousVehicleId) {
        transactionItems.push({
          Update: {
            TableName: this.tableName,
            Key: marshall({
              pk: `VEHICLE#${previousVehicleId}`,
              sk: 'METADATA',
            }),
            UpdateExpression: 'SET #data.#status = :available, #data.#assignedDriverId = :emptyString',
            ExpressionAttributeNames: {
              '#data': 'data',
              '#status': 'status',
              '#assignedDriverId': 'assignedDriverId',
            },
            ExpressionAttributeValues: marshall({
              ':available': 'available',
              ':emptyString': '', // Set assignedDriverId to an empty string
            }),
          },
        });
      }

      // Step 4: If a new vehicleId is provided, assign the new vehicle to the driver
      if (vehicleId && vehicleId.trim() !== '') {
        // Check if the vehicle is available
        const getVehicleParams = {
          TableName: this.tableName,
          Key: marshall({
            pk: `VEHICLE#${vehicleId}`,
            sk: 'METADATA',
          }),
          ProjectionExpression: '#data.#status',
          ExpressionAttributeNames: {
            '#data': 'data',
            '#status': 'status',
          },
        };
        const getVehicleCommand = new GetItemCommand(getVehicleParams);
        const vehicleResponse = await docClient.send(getVehicleCommand);

        if (!vehicleResponse.Item) {
          throw new Error(`Vehicle with ID ${vehicleId} does not exist.`);
        }

        const unmarshalledVehicle = unmarshall(vehicleResponse.Item);
        const vehicleStatus = unmarshalledVehicle.data?.status;

        if (vehicleStatus !== 'available') {
          throw new Error(`Vehicle with ID ${vehicleId} is not available for assignment.`);
        }

        // Add the new vehicle assignment to the transaction
        transactionItems.push(
          {
            Update: {
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
            },
          },
          {
            Update: {
              TableName: this.tableName,
              Key: marshall({
                pk: `DRIVER#${driverId}`,
                sk: `DRIVER#${driverName}`,
              }),
              UpdateExpression: 'SET #data.#assignedVehicleId = :vehicleId',
              ExpressionAttributeNames: {
                '#data': 'data',
                '#assignedVehicleId': 'assignedVehicleId',
              },
              ExpressionAttributeValues: marshall({
                ':vehicleId': vehicleId,
              }),
            },
          }
        );
      } else {
        // Step 5: If no new vehicleId is provided, clear the assignedVehicleId for the driver
        transactionItems.push({
          Update: {
            TableName: this.tableName,
            Key: marshall({
              pk: `DRIVER#${driverId}`,
              sk: `DRIVER#${driverName}`,
            }),
            UpdateExpression: 'SET #data.#assignedVehicleId = :emptyString',
            ExpressionAttributeNames: {
              '#data': 'data',
              '#assignedVehicleId': 'assignedVehicleId',
            },
            ExpressionAttributeValues: marshall({
              ':emptyString': '', // Clear the assignedVehicleId field
            }),
          },
        });
      }

      // Step 6: Execute the transaction
      if (transactionItems.length > 0) {
        const transactWriteParams: TransactWriteItemsCommandInput = { TransactItems: transactionItems };
        const transactionCommand = new TransactWriteItemsCommand(transactWriteParams);
        await docClient.send(transactionCommand);
      }

      console.log('Vehicle successfully assigned to driver.');
    } catch (error) {
      console.error('Error assigning vehicle to driver in transaction:', error);
      throw error;
    }
  }
}