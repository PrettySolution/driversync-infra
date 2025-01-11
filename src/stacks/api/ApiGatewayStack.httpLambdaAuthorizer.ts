import { APIGatewayProxyHandlerV2 } from 'aws-lambda';

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  if (event.headers.authorization) {
    return {
      statusCode: 200,
      isAuthorized: true,
      context: {
        user: event.headers.authorization,
      },
    };
  } else {
    return {
      isAuthorized: false,
    };
  }
};
