import { Request, Response } from 'express';
import { VehicleService } from '../services/vehicleService';

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

  // Assign a vehicle to a driver
  async assignVehicleToDriver(req: Request, res: Response): Promise<void> {
    const { vehicleId, driverId, driverName } = req.body;

    try {
      await this.vehicleService.assignVehicleToDriver(vehicleId, driverId, driverName);
      res.status(200).json({ message: 'Vehicle assigned successfully', vehicleId, driverId });
    } catch (error) {
      res.status(500).json({ error: 'Failed to assign vehicle' });
    }
  }
}