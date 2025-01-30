export const tableName = process.env.BASE_TABLE_NAME;
export interface Report {
  ownerId: string;
  timestamp: string;
  type?: string;
}
