import { APIGatewayProxyCognitoAuthorizer } from 'aws-lambda/trigger/api-gateway-proxy';
import { Request, Response, NextFunction } from 'express';

export function authorizerMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!req.requestContext?.authorizer?.jwt?.claims?.username && req.headers.authorization) {
    console.log('ERROR: Authorizer middleware should not be applied in PROD');
    const claims = decodeJwtPayload(req.headers.authorization);
    req.requestContext = { authorizer: { jwt: { claims } } };
  }
  next();
}

function decodeJwtPayload(token: string): any {
  const payload = token.split('.')[1]; // Get the payload part of the token
  return JSON.parse(Buffer.from(payload, 'base64').toString('utf-8')); // Decode the Base64 payload
}