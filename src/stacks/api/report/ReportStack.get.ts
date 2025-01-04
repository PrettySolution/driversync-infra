import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { REPORT_TABLE_NAME } from './ReportStack';

export const handler: APIGatewayProxyHandlerV2 = async (event, context, callback) => {
  try {
    console.log('req', event, context, callback);
    console.log('table: ', process.env[REPORT_TABLE_NAME]);
    return {
      statusCode: 200,
      body: JSON.stringify({ event, context, callback }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ table: process.env[REPORT_TABLE_NAME] }),
    };
  }
};