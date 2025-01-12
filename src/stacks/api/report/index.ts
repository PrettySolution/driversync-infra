import serverless from 'serverless-http';
import app from './express-app';

// Wrap the express app with serverless-http
export const handler = serverless(app);

export const REPORT_TABLE_NAME: string = 'REPORT_TABLE_NAME';

export interface AuthorizerContext {
  user: string;
}

export interface IReport {
  timestamp: string;
  owner: string;
  type?: string;
}

export interface QueryStringParameters {
  LastEvaluatedKey?: string;
}