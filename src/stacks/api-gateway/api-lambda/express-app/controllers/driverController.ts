import { Request, Response } from 'express';
import { DriverService } from '../services/driverService';

export class DriverController {
  private driverService: DriverService;

  constructor(tableName: string) {
    this.driverService = new DriverService(tableName);
  }

  // Create a new driver
  async createDriver(req: Request, res: Response): Promise<void> {
    const { driverId, name } = req.body;

    try {
      await this.driverService.createDriver(driverId, name);
      res.status(201).json({ message: 'User created successfully', driverId });
    } catch (error) {
      if (error instanceof Error && error.message === 'User already exists') {
        res.status(400).json({ error: 'User already exists' });
      } else {
        res.status(500).json({ error: 'Failed to create driver' });
      }
    }
  }

  // List all drivers
  async listDrivers(req: Request, res: Response): Promise<void> {
    try {
      const drivers = await this.driverService.listDrivers();
      res.json(drivers);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch drivers' });
    }
  }
}