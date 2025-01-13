
import express from 'express';
import { AuthorizerContext } from './interfaces';
import { authorizerMiddleware } from './middlewares/authorizerMiddleware';
import { loggerMiddleware } from './middlewares/loggerMiddleware';
import { reportRouter } from './routes/report';

declare global {
  namespace Express {
    interface Request {
      requestContext: { authorizer: { lambda: AuthorizerContext } };
    }
  }
}

const app = express();

app.use(express.json());
app.use(loggerMiddleware);
app.use(authorizerMiddleware);


app.use('/api/report', reportRouter);

app.route('/api/report/debug')
  .all((req, res) => {
    res.json({
      body: req.body,
      query: req.query,
      authorizerContext: req.requestContext.authorizer.lambda,
    });
  });

// Export the app for serverless-http
export default app;