export const REPORT_TABLE_NAME: string = 'REPORT_TABLE_NAME';

export interface AuthorizerContext {
  user: string;
}

export interface IReport {
  timestamp: string;
  ownerId: string;
  type?: string;
}

export interface QueryStringParameters {
  LastEvaluatedKey?: string;
}