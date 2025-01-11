import { Stack, StackProps } from 'aws-cdk-lib';
import { HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaAuthorizer, HttpLambdaResponseType } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface DebugStackProps extends StackProps {
  api: HttpApi;
}

export class DebugStack extends Stack {
  constructor(scope: Construct, id: string, props: DebugStackProps) {
    super(scope, id, props);

    const httpLambdaAuthorizer = new NodejsFunction(this, 'httpLambdaAuthorizer', {
      runtime: Runtime.NODEJS_20_X,
      logRetention: RetentionDays.ONE_MONTH,
    });

    // @ts-ignore
    const authorizer = new HttpLambdaAuthorizer('debugAuthorizer', httpLambdaAuthorizer, {
      responseTypes: [HttpLambdaResponseType.SIMPLE],
    });

    const debugLambda = new NodejsFunction(this, 'debugLambda', {
      runtime: Runtime.NODEJS_20_X,
      logRetention: RetentionDays.ONE_MONTH,
    });

    props.api.addRoutes({
      path: '/api/debug',
      methods: [HttpMethod.ANY],
      integration: new HttpLambdaIntegration('integration', debugLambda),
    });

    props.api.addRoutes({
      path: '/api/debug/authorizer',
      methods: [HttpMethod.ANY],
      integration: new HttpLambdaIntegration('integration', debugLambda),
      authorizer: authorizer,
    });
  }
}