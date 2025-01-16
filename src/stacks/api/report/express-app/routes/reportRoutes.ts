import express from 'express'
import { getAllReports } from '../controllers/reportController'

const router = express.Router()

router.get('/', getAllReports)

export default router
