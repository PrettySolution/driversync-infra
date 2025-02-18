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
import cors from 'cors';

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

app.use(cors());

const tableName = process.env.BASE_TABLE_NAME || 'dev-DynamoDBStack-Base93336DB5-OJV0MDR988IA';

// routes
app.use('/api/reports', reportRoutes);
app.use('/api', vehicleRoutes(tableName));
app.use('/api', driverRoutes(tableName));
app.route('/api/reports/debug').all((req, res) => {
  res.json({
    body: req.body,
    query: req.query,
    requestContext: req.requestContext,
  });
});

// Export the app for serverless-http
export default app;
