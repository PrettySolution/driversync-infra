import { Router } from 'express';
import { DriverController } from '../controllers/driverController';

const router = Router();

class DriverRoutes {
  private driverController: DriverController;

  constructor(tableName: string) {
    this.driverController = new DriverController(tableName);
  }

  public routes(): Router {
    router.get('/drivers', this.driverController.listDrivers.bind(this.driverController));
    router.post('/drivers', this.driverController.createDriver.bind(this.driverController));
    return router;
  }
}

export default function driverRoutes(tableName: string): Router {
  return new DriverRoutes(tableName).routes();
}