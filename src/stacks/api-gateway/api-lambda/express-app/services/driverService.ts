import { DriverModel } from "../models/driverModel";

export class DriverService {
  private driverModel: DriverModel;

  constructor(tableName: string) {
    this.driverModel = new DriverModel(tableName);
  }

  // Create a new driver
  async createDriver(driverId: string, name: string): Promise<void> {
    return this.driverModel.createDriver(driverId, name);
  }
}