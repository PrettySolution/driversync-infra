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
}