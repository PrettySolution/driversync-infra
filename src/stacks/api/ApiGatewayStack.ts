import { Stack, StackProps } from 'aws-cdk-lib';
import { CorsHttpMethod, HttpApi } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaAuthorizer, HttpLambdaResponseType } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import { UserPool } from 'aws-cdk-lib/aws-cognito';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface ApiGatewayStackProps extends StackProps {
  userPool: UserPool;
}

export class ApiGatewayStack extends Stack {
  readonly api: HttpApi;
  readonly authorizer: HttpLambdaAuthorizer;

  constructor(scope: Construct, id: string, props?: ApiGatewayStackProps) {
    super(scope, id, props);

    const httpLambdaAuthorizer = new NodejsFunction(this, 'httpLambdaAuthorizer', {
      runtime: Runtime.NODEJS_20_X,
      logRetention: RetentionDays.ONE_MONTH,
    });

    this.authorizer = new HttpLambdaAuthorizer('authorizer', httpLambdaAuthorizer, {
      responseTypes: [HttpLambdaResponseType.SIMPLE],
    });

    this.api = new HttpApi(this, 'httpApi', {
      disableExecuteApiEndpoint: false,
      corsPreflight: {
        allowHeaders: ['*'],
        allowMethods: [CorsHttpMethod.ANY],
        allowOrigins: ['*'],
      },
    });

  }
}