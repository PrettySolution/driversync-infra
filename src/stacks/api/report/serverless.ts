import serverless from 'serverless-http';
import app from './express-app';

// Wrap the express app with serverless-http
export const handler = serverless(app);

