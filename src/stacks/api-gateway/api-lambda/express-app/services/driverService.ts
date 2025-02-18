import { DriverModel } from '../models/driverModel';

export class DriverService {
  private driverModel: DriverModel;

  constructor(tableName: string) {
    this.driverModel = new DriverModel(tableName);
  }

  // Create a new driver
  async createDriver(driverId: string, name: string): Promise<void> {
    try {
      await this.driverModel.createDriver(driverId, name);
    } catch (error) {
      if (error instanceof Error && error.message === 'User already exists') {
        throw new Error('User already exists');
      }
      throw new Error('Failed to create driver');
    }
  }

  // List all drivers
  async listDrivers(): Promise<any[] | undefined> {
    return this.driverModel.listDrivers();
  }
}