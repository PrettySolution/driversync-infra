import path from 'path';
import { Stack, StackProps } from 'aws-cdk-lib';
import { CorsHttpMethod, HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaAuthorizer, HttpLambdaResponseType } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { UserPool } from 'aws-cdk-lib/aws-cognito';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { REPORT_TABLE_NAME } from './report/serverless';
import { TABLES } from '../core/DynamoDBStack';

interface ApiGatewayStackProps extends StackProps {
  userPool: UserPool;
}

export class ApiGatewayStack extends Stack {
  readonly api: HttpApi;

  constructor(scope: Construct, id: string, props: ApiGatewayStackProps) {
    super(scope, id, props);

    const reportTable = Table.fromTableName(this, 'reportTable', StringParameter.valueForStringParameter(this, TABLES.REPORT_TABLE_PARAMETER_NAME));

    const httpLambdaAuthorizer = new NodejsFunction(this, 'httpLambdaAuthorizer', {
      runtime: Runtime.NODEJS_20_X,
      logRetention: RetentionDays.ONE_MONTH,
    });

    const authorizer = new HttpLambdaAuthorizer('authorizer', httpLambdaAuthorizer, {
      responseTypes: [HttpLambdaResponseType.SIMPLE],
    });

    const report = new NodejsFunction(this, 'report', {
      runtime: Runtime.NODEJS_20_X,
      entry: path.join(__dirname, './report/serverless.ts'),
      logRetention: RetentionDays.ONE_MONTH,
      environment: { [REPORT_TABLE_NAME]: reportTable.tableName },
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

    this.api.addRoutes({
      path: '/api/report',
      methods: [HttpMethod.ANY],
      integration: new HttpLambdaIntegration('integration', report),
      authorizer: authorizer,
    });
    this.api.addRoutes({
      path: '/api/report/{proxy+}',
      methods: [HttpMethod.ANY],
      integration: new HttpLambdaIntegration('integration', report),
      authorizer: authorizer,
    });

    reportTable.grantReadWriteData(report);
  }
}