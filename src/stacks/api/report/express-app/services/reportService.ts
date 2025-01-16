import { QueryCommand } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'
import ddbClient from '../config/dynamoDB'
import { Report } from '../models/reportModel'

export interface IGetAllReportsWithPagination {
    ownerId: string
    limit: number
    lastEvaluatedKey?: string
}

export const getAllReportsWithPagination = async ({
    ownerId,
    limit = 2,
    lastEvaluatedKey,
}: IGetAllReportsWithPagination): Promise<{
    items: Report[]
    lastEvaluatedKey?: string
}> => {
    try {
        const params = {
            TableName: process.env.REPORT_TABLE_NAME,
            KeyConditionExpression: 'ownerId = :ownerValue',
            ExpressionAttributeValues: {
                ':ownerValue': { S: ownerId },
            },
            Limit: limit,
            ExclusiveStartKey: lastEvaluatedKey
                ? marshall({
                      ownerId,
                      timestamp: lastEvaluatedKey,
                  })
                : undefined,
        }

        const command = new QueryCommand(params)
        const data = await ddbClient.send(command)

        // Extract LastEvaluatedKey if it exists
        let newLastEvaluatedKey: string | undefined
        if (data.LastEvaluatedKey) {
            const lastItem = unmarshall(data.LastEvaluatedKey) as Report
            newLastEvaluatedKey = lastItem.timestamp
        }

        // Convert items from DynamoDB response to usable format
        const items: Report[] = []
        if (data.Items) {
            data.Items.forEach((i: any) => items.push(unmarshall(i) as Report))
        }

        return {
            items,
            lastEvaluatedKey: newLastEvaluatedKey,
        }
    } catch (error) {
        console.error('Error fetching reports:', error)
        throw new Error('Unable to fetch reports')
    }
}
