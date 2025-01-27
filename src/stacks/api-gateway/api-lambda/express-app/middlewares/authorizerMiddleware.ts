import { APIGatewayProxyCognitoAuthorizer } from 'aws-lambda/trigger/api-gateway-proxy';
import { Request, Response, NextFunction } from 'express';

export function authorizerMiddleware(req: Request, _: Response, next: NextFunction): void {
  if (!req.requestContext?.authorizer?.jwt?.claims?.sub) {
    console.log('Authorizer middleware applied');
    const claims: APIGatewayProxyCognitoAuthorizer = {
      claims: {
        sub: '00000000-0000-0000-0000-000000000000',
        username: 'user01',
      },
    };
    req.requestContext = { authorizer: { jwt: claims } };
  }
  next();
}
