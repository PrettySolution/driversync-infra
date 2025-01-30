import path from 'path';
import { Stack, StackProps } from 'aws-cdk-lib';
import { CorsHttpMethod, HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpUserPoolAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { UserPool, UserPoolClient } from 'aws-cdk-lib/aws-cognito';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { ThisEnvironment } from '../../interfaces';
import { TABLES } from '../core/DynamoDBStack';
import { BASE_TABLE_NAME } from './api-lambda/express-app/interfaces';

interface ApiGatewayStackProps extends StackProps {
  env: ThisEnvironment;
}

export class ApiGatewayStack extends Stack {
  readonly api: HttpApi;

  constructor(scope: Construct, id: string, props: ApiGatewayStackProps) {
    super(scope, id, props);

    const baseTable = Table.fromTableName(this, 'baseTable', StringParameter.valueForStringParameter(this, TABLES.BASE_TABLE_PARAMETER_NAME));
    const userPool = UserPool.fromUserPoolId(this, 'userPool', props.env.frontend.VITE_COGNITO_AUTHORITY.split('/').pop()!);
    const userPoolClient = UserPoolClient.fromUserPoolClientId(this, 'userPoolClient', props.env.frontend.VITE_COGNITO_CLIENT_ID);

    // const httpLambdaAuthorizer = new NodejsFunction(this, 'httpLambdaAuthorizer', {
    //   runtime: Runtime.NODEJS_20_X,
    //   logRetention: RetentionDays.ONE_MONTH,
    // });


    const userPoolAuthorizer = new HttpUserPoolAuthorizer('userPoolAuthorizer', userPool, {
      userPoolClients: [userPoolClient],
    });

    const apiLambda = new NodejsFunction(this, 'apiLambda', {
      runtime: Runtime.NODEJS_20_X,
      entry: path.join(__dirname, './api-lambda/serverless.ts'),
      logRetention: RetentionDays.ONE_MONTH,
      environment: { [BASE_TABLE_NAME]: baseTable.tableName },
      // timeout: Duration.seconds(15),
    });

    this.api = new HttpApi(this, 'httpApi', {
      disableExecuteApiEndpoint: false,
      corsPreflight: {
        allowHeaders: ['*'],
        allowMethods: [CorsHttpMethod.ANY],
        allowOrigins: ['*'],
      },
    });

    // const debugLambda = new Function(this, 'debugLambda', {
    //   runtime: Runtime.PYTHON_3_13,
    //   handler: 'index.lambda_handler',
    //   code: Code.fromInline('def lambda_handler(event, context): return event'),
    // });
    //
    // this.api.addRoutes({
    //   path: '/api',
    //   methods: [HttpMethod.ANY],
    //   integration: new HttpLambdaIntegration('integration', debugLambda),
    //   authorizer: userPoolAuthorizer,
    // });

    this.api.addRoutes({
      path: '/api/{proxy+}',
      methods: [HttpMethod.ANY],
      integration: new HttpLambdaIntegration('integration', apiLambda),
      authorizer: userPoolAuthorizer,
    });


    baseTable.grantReadWriteData(apiLambda);
  }
}
