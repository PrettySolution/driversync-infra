import { Request, Response, NextFunction } from 'express';
import { AuthorizerContext } from '../interfaces';

export function authorizerMiddleware(req: Request, _: Response, next: NextFunction): void {
  if (!req.requestContext?.authorizer?.lambda) {
    console.log('Authorizer middleware applied');
    const context: AuthorizerContext = { user: req.headers.authorization! };
    req.requestContext = { authorizer: { lambda: context } };
  }
  next();
}
