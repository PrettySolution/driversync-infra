export const tableName = process.env.REPORT_TABLE_NAME
export interface Report {
    timestamp: string
    ownerId: string
    type?: string
}
