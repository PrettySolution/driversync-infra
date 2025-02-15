import {
  APIGatewayProxyCognitoAuthorizer,
  APIGatewayProxyEventV2WithRequestContext,
} from 'aws-lambda/trigger/api-gateway-proxy';
import express from 'express';
import { authorizerMiddleware } from './middlewares/authorizerMiddleware';
import { loggerMiddleware } from './middlewares/loggerMiddleware';
import driverRoutes from './routes/driverRoutes';
import reportRoutes from './routes/reportRoutes';
import vehicleRoutes from './routes/vehicleRoutes';

interface IRequestContext {
  authorizer: {
    jwt: APIGatewayProxyCognitoAuthorizer;
  };
}

declare global {
  namespace Express {
    interface Request extends APIGatewayProxyEventV2WithRequestContext<IRequestContext> {
    }
  }
}

const app = express();

app.use(express.json());
app.use(loggerMiddleware);
app.use(authorizerMiddleware);

// routes
app.use('/api/reports', reportRoutes);
app.use('/api', vehicleRoutes(process.env.BASE_TABLE_NAME || 'dev-DynamoDBStack-Base93336DB5-OJV0MDR988IA'));
app.use('/api', driverRoutes(process.env.BASE_TABLE_NAME || 'dev-DynamoDBStack-Base93336DB5-OJV0MDR988IA'));
app.route('/api/reports/debug').all((req, res) => {
  res.json({
    body: req.body,
    query: req.query,
    requestContext: req.requestContext,
  });
});

// Export the app for serverless-http
export default app;
