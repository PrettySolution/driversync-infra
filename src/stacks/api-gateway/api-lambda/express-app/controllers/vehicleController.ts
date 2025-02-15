import { VehicleService } from '../services/vehicleService';
import { Request, Response } from 'express';

export class VehicleController {
  private vehicleService: VehicleService;

  constructor(tableName: string) {
    this.vehicleService = new VehicleService(tableName);
  }

  // Create a new vehicle
  async createVehicle(req: Request, res: Response): Promise<void> {
    const { model, plate, odometer } = req.body;

    try {
      await this.vehicleService.createVehicle(model, plate, odometer);
      res.status(201).json({ message: 'Vehicle created successfully' });
    } catch (error) {
      console.error('Error creating vehicle: ', error);
      res.status(500).json({ error: 'Failed to create vehicle' });
    }
  }

  // List all vehicles
  async listVehicles(req: Request, res: Response): Promise<void> {
    try {
      const vehicles = await this.vehicleService.listVehicles();
      res.json(vehicles);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch vehicles' });
    }
  }
}