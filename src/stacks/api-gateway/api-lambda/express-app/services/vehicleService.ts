import { VehicleModel } from '../models/vehicleModel';

export class VehicleService {
  private vehicleModel: VehicleModel;

  constructor(tableName: string) {
    this.vehicleModel = new VehicleModel(tableName);
  }

  // Create a new vehicle
  async createVehicle(model: string, plate: string, odometer: number): Promise<void> {
    return this.vehicleModel.createVehicle(model, plate, odometer);
  }

  // List all vehicles
  async listVehicles(): Promise<any[] | undefined> {
    return this.vehicleModel.listVehicles();
  }

  // Assign a vehicle to a driver
  async assignVehicleToDriver(vehicleId: string, driverId: string, driverName: string): Promise<void> {
    return this.vehicleModel.assignVehicleToDriver(vehicleId, driverId, driverName);
  }
}