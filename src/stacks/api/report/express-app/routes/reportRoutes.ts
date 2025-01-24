import express from 'express';
import {
  getAllReports,
  createReport,
  getReport,
  updateReport,
  deleteReport,
} from '../controllers/reportController';

const router = express.Router();

// Routes for creating and fetching reports
router.route('/').post(createReport).get(getAllReports);

// Routes for report operations (get, update, delete)
router
  .route('/:timestamp')
  .get(getReport) // Fetch a report
  .put(updateReport) // Update a report
  .delete(deleteReport); // Delete a report

// // Middleware to validate the timestamp parameter
// router.param('timestamp', (_req, _res, next, timestamp: string) => {
//     // req.report = Reports[timestamp];
//     console.debug('run timestamp middleware here', timestamp)
//     next()
// })

export default router;
