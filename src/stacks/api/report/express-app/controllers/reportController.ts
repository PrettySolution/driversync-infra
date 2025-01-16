import { Request, Response } from 'express'
import * as reportService from '../services/reportService'

export const getAllReports = async (
    req: Request,
    res: Response
): Promise<void> => {
    const limit = parseInt(req.query.limit as string, 10) || 2
    const lastEvaluatedKey = req.query.cursor as string
    const ownerId = req.requestContext?.authorizer?.lambda?.user

    if (!ownerId) {
        res.status(400).json({ message: 'Missing ownerId in request context' })
        return
    }

    try {
        const { items, lastEvaluatedKey: newLastEvaluatedKey } =
            await reportService.getAllReportsWithPagination({
                ownerId,
                limit,
                lastEvaluatedKey,
            })

        res.status(200).json({
            items,
            limit,
            lastEvaluatedKey: newLastEvaluatedKey,
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Failed to fetch reports' })
    }
}
