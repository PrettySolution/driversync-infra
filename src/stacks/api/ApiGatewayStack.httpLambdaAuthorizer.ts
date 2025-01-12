import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { AuthorizerContext } from './report';

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  if (event.headers.authorization) {
    const context: AuthorizerContext = {
      user: event.headers.authorization,
    };
    return {
      statusCode: 200,
      isAuthorized: true,
      context,
    };
  } else {
    return {
      isAuthorized: false,
    };
  }
};
