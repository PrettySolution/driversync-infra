import { Router } from 'express';
import { VehicleController } from '../controllers/vehicleController';

const router = Router();

class VehicleRoutes {
  private vehicleController: VehicleController;

  constructor(tableName: string) {
    this.vehicleController = new VehicleController(tableName);
  }

  public routes(): Router {
    router.get('/vehicles', this.vehicleController.listVehicles.bind(this.vehicleController));
    // router.get('/vehicles/:vehicleId', this.vehicleController.getVehicleById.bind(this.vehicleController));
    router.post('/vehicles', this.vehicleController.createVehicle.bind(this.vehicleController));
    return router;
  }
}

export default function vehicleRoutes(tableName: string): Router {
  return new VehicleRoutes(tableName).routes();
}