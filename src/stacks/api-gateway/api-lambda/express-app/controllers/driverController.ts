import { DriverService } from "../services/driverService";
import { Request, Response } from 'express';

export class DriverController {
  private driverService: DriverService;

  constructor(tableName: string) {
    this.driverService = new DriverService(tableName);
  }

  // Create a new driver
  async createDriver(req: Request, res: Response): Promise<void> {
    const { driverId, name } = req.body;

    if (!driverId || !name) {
      res.status(400).json({ error: 'driverId and name are required' });
    }

    try {
      await this.driverService.createDriver(driverId, name);
      res.status(201).json({ message: 'User created successfully', driverId });
    } catch (error) {
      console.error('Error creating driver: ', error);
      res.status(500).json({ error: 'Failed to create driver' });
    }
  }
}